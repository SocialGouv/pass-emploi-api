import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import {
  HandleJobTraiterEvenementMiloHandler,
  Traitement
} from '../../../../src/application/commands/jobs/handle-job-traiter-evenement-milo.handler'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { Partenaire } from '../../../../src/domain/partenaire/partenaire'
import { Planificateur } from '../../../../src/domain/planificateur'
import { RendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { SuiviJob } from '../../../../src/domain/suivi-job'
import { DateService } from '../../../../src/utils/date-service'
import { uneDate, uneDatetime } from '../../../fixtures/date.fixture'
import { uneJeuneConfigurationApplication } from '../../../fixtures/jeune-configuration-application.fixture'
import {
  unEvenementMilo,
  unRendezVousMilo
} from '../../../fixtures/partenaire.fixture'
import { unRendezVous } from '../../../fixtures/rendez-vous.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobTraiterEvenementMiloHandler', () => {
  let handler: HandleJobTraiterEvenementMiloHandler
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let configJeuneRepository: StubbedType<Jeune.ConfigurationApplication.Repository>
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let miloEvenementsHttpRepository: StubbedType<Partenaire.Milo.Repository>
  let rendezVousMiloFactory: StubbedClass<Partenaire.Milo.RendezVous.Factory>

  const idPartenaireBeneficiaire = '123456'

  beforeEach(() => {
    const sandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
    configJeuneRepository = stubInterface(sandbox)
    rendezVousRepository = stubInterface(sandbox)
    miloEvenementsHttpRepository = stubInterface(sandbox)
    rendezVousMiloFactory = stubClass(Partenaire.Milo.RendezVous.Factory)

    handler = new HandleJobTraiterEvenementMiloHandler(
      suiviJobService,
      dateService,
      configJeuneRepository,
      rendezVousRepository,
      miloEvenementsHttpRepository,
      rendezVousMiloFactory
    )
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      beforeEach(() => {
        configJeuneRepository.getByIdPartenaire
          .withArgs(idPartenaireBeneficiaire)
          .resolves(uneJeuneConfigurationApplication())
      })

      describe('événement de création', () => {
        describe('rendez vous', () => {
          describe('quand le rendez-vous existe chez milo', () => {
            it('crée le rendez-vous en base de données', async () => {
              // Given
              const evenement = unEvenementMilo({
                idPartenaireBeneficiaire,
                objet: Partenaire.Milo.ObjetEvenement.RENDEZ_VOUS,
                type: Partenaire.Milo.TypeEvenement.CREATE
              })
              const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
                {
                  dateExecution: uneDate(),
                  type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
                  contenu: evenement
                }
              const rendezVousMilo: Partenaire.Milo.RendezVous =
                unRendezVousMilo()
              miloEvenementsHttpRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)

              const rendezVous: RendezVous = unRendezVous()
              rendezVousMiloFactory.creerRendezVousPassEmploi.returns(
                rendezVous
              )

              // When
              await handler.handle(job)

              // Then
              expect(
                rendezVousRepository.save
              ).to.have.been.calledOnceWithExactly(rendezVous)
            })
          })
          describe('quand le rendez-vous n’existe pas chez milo', () => {
            it('on ne fait rien', async () => {
              // Given
              const evenement = unEvenementMilo({
                idPartenaireBeneficiaire,
                objet: Partenaire.Milo.ObjetEvenement.RENDEZ_VOUS,
                type: Partenaire.Milo.TypeEvenement.CREATE
              })

              const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
                {
                  dateExecution: uneDate(),
                  type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
                  contenu: evenement
                }

              miloEvenementsHttpRepository.findRendezVousByEvenement
                .withArgs(evenement.idObjet)
                .resolves(undefined)

              // When
              const result: SuiviJob = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.RENDEZ_VOUS_INEXISTANT
              })
              expect(rendezVousRepository.save).to.not.have.been.called()
            })
          })
        })
        describe('objet non traitable', () => {
          it('ne fait rien', async () => {
            // Given
            const evenement = unEvenementMilo({
              idPartenaireBeneficiaire,
              objet: Partenaire.Milo.ObjetEvenement.NON_TRAITABLE,
              type: Partenaire.Milo.TypeEvenement.CREATE
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
              traitement: Traitement.OBJET_NON_TRAITABLE
            })
          })
        })
      })
      describe('événement non traitable', () => {
        it('ne fait rien', async () => {
          // Given
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: Partenaire.Milo.ObjetEvenement.RENDEZ_VOUS,
            type: Partenaire.Milo.TypeEvenement.NON_TRAITABLE
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
            traitement: Traitement.TYPE_NON_TRAITABLE
          })
        })
      })
    })
    describe('quand le jeune n’existe pas', () => {
      it('on ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: Partenaire.Milo.ObjetEvenement.RENDEZ_VOUS,
          type: Partenaire.Milo.TypeEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }
        configJeuneRepository.getByIdPartenaire
          .withArgs(idPartenaireBeneficiaire)
          .resolves(undefined)

        // When
        const result: SuiviJob = await handler.handle(job)

        // Then
        expect(result.resultat).to.be.deep.equal({
          traitement: Traitement.JEUNE_INEXISTANT
        })
        expect(rendezVousRepository.save).to.not.have.been.called()
      })
    })
  })
})
