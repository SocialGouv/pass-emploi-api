import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import {
  TraiterEvenementMiloJobHandler,
  Traitement
} from '../../../../src/application/jobs/rendez-vous-milo/traiter-evenement-milo.handler'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import {
  Planificateur,
  PlanificateurService
} from '../../../../src/domain/planificateur'
import { RendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { SuiviJob } from '../../../../src/domain/suivi-job'
import { DateService } from '../../../../src/utils/date-service'
import { uneDate, uneDatetime } from '../../../fixtures/date.fixture'
import {
  unEvenementMilo,
  unRendezVousMilo
} from '../../../fixtures/partenaire.fixture'
import { unRendezVous } from '../../../fixtures/rendez-vous.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { RendezVousMilo } from '../../../../src/domain/rendez-vous/rendez-vous.milo'
import { Notification } from '../../../../src/domain/notification/notification'
import { testConfig } from '../../../utils/module-for-testing'

describe('TraiterEvenementMiloJobHandler', () => {
  let handler: TraiterEvenementMiloJobHandler
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let miloRendezVousRepository: StubbedType<RendezVousMilo.Repository>
  let rendezVousMiloFactory: StubbedClass<RendezVousMilo.Factory>
  let notificationService: StubbedClass<Notification.Service>
  let planificateurService: StubbedClass<PlanificateurService>

  const jeune: Jeune = unJeune()
  const idPartenaireBeneficiaire = '123456'

  beforeEach(() => {
    const sandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
    jeuneRepository = stubInterface(sandbox)
    rendezVousRepository = stubInterface(sandbox)
    miloRendezVousRepository = stubInterface(sandbox)
    rendezVousMiloFactory = stubClass(RendezVousMilo.Factory)
    notificationService = stubClass(Notification.Service)
    planificateurService = stubClass(PlanificateurService)

    handler = new TraiterEvenementMiloJobHandler(
      suiviJobService,
      dateService,
      jeuneRepository,
      rendezVousRepository,
      miloRendezVousRepository,
      rendezVousMiloFactory,
      notificationService,
      planificateurService,
      testConfig()
    )
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      beforeEach(() => {
        jeuneRepository.getByIdPartenaire
          .withArgs(idPartenaireBeneficiaire)
          .resolves(jeune)
      })

      describe('quand le rendez-vous existe chez milo', () => {
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }
        // Given
        const rendezVousMilo: RendezVousMilo = unRendezVousMilo()

        beforeEach(() => {
          miloRendezVousRepository.findRendezVousByEvenement
            .withArgs(evenement)
            .resolves(rendezVousMilo)
        })
        describe("quand le rendez vous n'existait pas chez nous", () => {
          it('crée le rendez-vous en base de données et envoie une notif', async () => {
            // Given
            rendezVousRepository.getByIdPartenaire
              .withArgs(evenement.idObjet, evenement.objet)
              .resolves(undefined)

            const rendezVous: RendezVous = unRendezVous()
            rendezVousMiloFactory.creerRendezVousPassEmploi
              .withArgs(rendezVousMilo, jeune)
              .returns(rendezVous)

            // When
            await handler.handle(job)

            // Then
            expect(
              rendezVousRepository.save
            ).to.have.been.calledOnceWithExactly(rendezVous)
            expect(
              notificationService.notifierLesJeunesDuRdv
            ).to.have.been.calledOnceWithExactly(
              rendezVous,
              Notification.Type.NEW_RENDEZVOUS
            )
            expect(
              planificateurService.planifierRappelsRendezVous
            ).to.have.been.calledOnceWithExactly(rendezVous)
          })
        })
        describe('quand le rendez vous existait chez nous', () => {
          it('le met à jour et envoie une notification', async () => {
            // Given
            const unRendezVousExistant = unRendezVous()
            rendezVousRepository.getByIdPartenaire
              .withArgs(evenement.idObjet, evenement.objet)
              .resolves(unRendezVousExistant)

            const rendezVousModifie: RendezVous = unRendezVous({
              duree: 120
            })
            rendezVousMiloFactory.mettreAJourRendezVousPassEmploi
              .withArgs(unRendezVousExistant, rendezVousMilo)
              .returns(rendezVousModifie)

            // When
            await handler.handle(job)

            // Then
            expect(
              rendezVousMiloFactory.creerRendezVousPassEmploi
            ).not.to.have.been.called()
            expect(
              rendezVousRepository.save
            ).to.have.been.calledOnceWithExactly(rendezVousModifie)
            expect(
              notificationService.notifierLesJeunesDuRdv
            ).to.have.been.calledOnceWithExactly(
              rendezVousModifie,
              Notification.Type.UPDATED_RENDEZVOUS
            )
            expect(
              planificateurService.supprimerRappelsParId
            ).not.to.have.been.called()
            expect(
              planificateurService.planifierRappelsRendezVous
            ).not.to.have.been.called()
          })
          it('le met à jour et replanifie les rappels', async () => {
            // Given
            const unRendezVousExistant = unRendezVous()
            rendezVousRepository.getByIdPartenaire
              .withArgs(evenement.idObjet, evenement.objet)
              .resolves(unRendezVousExistant)

            const rendezVousModifie: RendezVous = unRendezVous({
              date: new Date('2023-10-10'),
              duree: 120
            })
            rendezVousMiloFactory.mettreAJourRendezVousPassEmploi
              .withArgs(unRendezVousExistant, rendezVousMilo)
              .returns(rendezVousModifie)

            // When
            await handler.handle(job)

            // Then
            expect(
              rendezVousMiloFactory.creerRendezVousPassEmploi
            ).not.to.have.been.called()
            expect(
              rendezVousRepository.save
            ).to.have.been.calledOnceWithExactly(rendezVousModifie)
            expect(
              notificationService.notifierLesJeunesDuRdv
            ).to.have.been.calledOnceWithExactly(
              rendezVousModifie,
              Notification.Type.UPDATED_RENDEZVOUS
            )
            expect(
              planificateurService.supprimerRappelsParId
            ).to.have.been.calledOnceWithExactly(unRendezVousExistant.id)
            expect(
              planificateurService.planifierRappelsRendezVous
            ).to.have.been.calledOnceWithExactly(rendezVousModifie)
          })
        })
      })
      describe('quand le rendez-vous n’existe pas chez milo', () => {
        describe("quand on ne l'avait pas chez nous", () => {
          it('on ne fait rien', async () => {
            // Given
            const evenement = unEvenementMilo({
              idPartenaireBeneficiaire,
              objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
              type: RendezVousMilo.TypeEvenement.CREATE
            })

            const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
              {
                dateExecution: uneDate(),
                type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
                contenu: evenement
              }

            miloRendezVousRepository.findRendezVousByEvenement
              .withArgs(evenement.idObjet)
              .resolves(undefined)

            // When
            const result: SuiviJob = await handler.handle(job)

            // Then
            expect(result.resultat).to.be.deep.equal({
              traitement: Traitement.RENDEZ_VOUS_INEXISTANT,
              idJeune: 'ABCDE',
              idRendezVous: undefined
            })
            expect(rendezVousRepository.save).to.not.have.been.called()
          })
        })
        describe("quand on l'avait chez nous", () => {
          it('on le supprime', async () => {
            // Given
            const evenement = unEvenementMilo({
              idPartenaireBeneficiaire,
              objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
              type: RendezVousMilo.TypeEvenement.CREATE
            })

            const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
              {
                dateExecution: uneDate(),
                type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
                contenu: evenement
              }

            miloRendezVousRepository.findRendezVousByEvenement
              .withArgs(evenement.idObjet)
              .resolves(undefined)

            const unRendezVousExistant = unRendezVous()
            rendezVousRepository.getByIdPartenaire
              .withArgs(evenement.idObjet, evenement.objet)
              .resolves(unRendezVousExistant)

            // When
            const result: SuiviJob = await handler.handle(job)

            // Then
            expect(result.resultat).to.be.deep.equal({
              traitement: Traitement.RENDEZ_VOUS_SUPPRIME,
              idJeune: 'ABCDE',
              idRendezVous: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb'
            })
            expect(
              rendezVousRepository.delete
            ).to.have.been.calledOnceWithExactly(unRendezVousExistant.id)
            expect(
              notificationService.notifierLesJeunesDuRdv
            ).to.have.been.calledOnceWithExactly(
              unRendezVousExistant,
              Notification.Type.DELETED_RENDEZVOUS
            )
            expect(
              planificateurService.supprimerRappelsParId
            ).to.have.been.calledOnceWithExactly(unRendezVousExistant.id)
          })
        })
      })
      describe('objet non traitable', () => {
        it('ne fait rien', async () => {
          // Given
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: RendezVousMilo.ObjetEvenement.NON_TRAITABLE,
            type: RendezVousMilo.TypeEvenement.CREATE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }

          // When
          const suiviJob = await handler.handle(job)

          // Then
          expect(rendezVousRepository.save).not.to.have.been.called()
          expect(suiviJob.resultat).to.be.deep.equal({
            traitement: Traitement.OBJET_NON_TRAITABLE,
            idJeune: undefined,
            idRendezVous: undefined
          })
        })
      })

      describe('événement non traitable', () => {
        it('ne fait rien', async () => {
          // Given
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
            type: RendezVousMilo.TypeEvenement.NON_TRAITABLE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }

          // When
          const suiviJob = await handler.handle(job)

          // Then
          expect(rendezVousRepository.save).not.to.have.been.called()
          expect(suiviJob.resultat).to.be.deep.equal({
            traitement: Traitement.TYPE_NON_TRAITABLE,
            idJeune: undefined,
            idRendezVous: undefined
          })
        })
      })
    })
    describe('quand le jeune n’existe pas', () => {
      it('on ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }
        jeuneRepository.getByIdPartenaire
          .withArgs(idPartenaireBeneficiaire)
          .resolves(undefined)

        // When
        const result: SuiviJob = await handler.handle(job)

        // Then
        expect(result.resultat).to.be.deep.equal({
          traitement: Traitement.JEUNE_INEXISTANT,
          idJeune: undefined,
          idRendezVous: undefined
        })
        expect(rendezVousRepository.save).to.not.have.been.called()
      })
    })
  })
})