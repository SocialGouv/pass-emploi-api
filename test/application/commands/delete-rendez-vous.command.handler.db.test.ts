import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { stubClassSandbox } from 'test/utils/types'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/rendezvous-authorizer'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler.db'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Mail } from '../../../src/domain/mail'
import { Conseiller } from '../../../src/domain/milo/conseiller'
import { Notification } from '../../../src/domain/notification/notification'
import { PlanificateurService } from '../../../src/domain/planificateur'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import {
  unConseillerDuJeune,
  uneConfiguration,
  unJeune
} from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('DeleteRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  let deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  let planificateurService: StubbedClass<PlanificateurService>
  let mailService: StubbedType<Mail.Service>
  let evenementService: StubbedClass<EvenementService>
  const jeune = unJeune({ configuration: uneConfiguration() })
  const rendezVous = unRendezVous({ jeunes: [jeune] })

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierLesJeunesDuRdv.resolves()
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    planificateurService = stubClass(PlanificateurService)
    mailService = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    deleteRendezVousCommandHandler = new DeleteRendezVousCommandHandler(
      rendezVousRepository,
      conseillerRepository,
      notificationService,
      rendezVousAuthorizer,
      planificateurService,
      mailService,
      evenementService
    )
  })

  describe('handle', () => {
    describe('quand le rendez-vous existe', () => {
      it('échoue si animation collective cloturée', async () => {
        // Given
        const rendezVous = unRendezVous({
          type: CodeTypeRendezVous.ATELIER,
          dateCloture: uneDatetime()
        })
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
        const command: DeleteRendezVousCommand = {
          idRendezVous: rendezVous.id
        }

        // When
        const result = await deleteRendezVousCommandHandler.handle(command)

        // Then
        expect(rendezVousRepository.delete).not.to.have.been.called()
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Une Animation Collective cloturée ne peut plus etre supprimée.'
            )
          )
        )
      })
      describe("quand l'invitation est à true", () => {
        describe('quand le conseiller qui supprime est différent du créateur', () => {
          it('envoie un email au créateur du rendez-vous', async () => {
            // Given
            const conseillerSuppression = unConseillerDuJeune({
              id: 'cons-suppr'
            })
            const conseillerCreateur = unConseiller({
              id: 'cons-crea',
              firstName: 'poi',
              lastName: 'poi'
            })
            jeune.conseiller = conseillerSuppression
            rendezVous.jeunes = [jeune]
            rendezVous.createur = {
              id: conseillerCreateur.id,
              nom: conseillerCreateur.lastName,
              prenom: conseillerCreateur.firstName
            }
            rendezVous.invitation = true
            const command: DeleteRendezVousCommand = {
              idRendezVous: rendezVous.id
            }
            rendezVousRepository.get
              .withArgs(rendezVous.id)
              .resolves(rendezVous)
            conseillerRepository.get
              .withArgs(conseillerCreateur.id)
              .resolves(conseillerCreateur)
            planificateurService.supprimerRappelsParId.resolves()
            rendezVousRepository.getAndIncrementRendezVousIcsSequence.resolves(
              1
            )

            // When
            await deleteRendezVousCommandHandler.handle(command)

            // Then
            expect(mailService.envoyerMailRendezVous).to.have.been.calledWith(
              conseillerCreateur,
              rendezVous,
              RendezVous.Operation.SUPPRESSION,
              1
            )
          })
        })
      })
      describe("quand l'invitation est à false", () => {
        it("n'envoie pas d'email au conseiller créateur", async () => {
          // Given
          const conseillerSuppression = unConseillerDuJeune({
            id: 'cons-suppr'
          })
          const conseillerCreateur = unConseiller({
            id: 'cons-crea',
            firstName: 'poi',
            lastName: 'poi'
          })
          jeune.conseiller = conseillerSuppression
          rendezVous.jeunes = [jeune]
          rendezVous.createur = {
            id: conseillerCreateur.id,
            nom: conseillerCreateur.lastName,
            prenom: conseillerCreateur.firstName
          }
          rendezVous.invitation = false
          const command: DeleteRendezVousCommand = {
            idRendezVous: rendezVous.id
          }
          rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
          conseillerRepository.get
            .withArgs(conseillerCreateur.id)
            .resolves(conseillerCreateur)
          planificateurService.supprimerRappelsParId.resolves()

          // When
          await deleteRendezVousCommandHandler.handle(command)

          // Then
          expect(mailService.envoyerMailRendezVous).not.to.have.been.called()
        })
      })
      describe("quand le jeune s'est déjà connecté au moins une fois sur l'application", () => {
        it('supprime le rendez-vous et envoie une notification au jeune', async () => {
          // Given
          rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
          const command: DeleteRendezVousCommand = {
            idRendezVous: rendezVous.id
          }

          // When
          const result = await deleteRendezVousCommandHandler.handle(command)

          // Then
          expect(rendezVousRepository.delete).to.have.been.calledWith(
            rendezVous.id
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            rendezVous,
            Notification.Type.DELETED_RENDEZVOUS
          )
          expect(result).to.deep.equal(emptySuccess())
        })
      })
    })
    describe("quand le rendez-vous n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(undefined)
        const command: DeleteRendezVousCommand = {
          idRendezVous: rendezVous.id
        }

        // When
        const result = await deleteRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.delete).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).not.to.have.been.calledOnceWithExactly(
          rendezVous,
          Notification.Type.DELETED_RENDEZVOUS
        )
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
        )
      })
    })

    describe('authorize', () => {
      it('autorise un jeune ou un conseiller à supprimer un rdv', async () => {
        // Given
        const command: DeleteRendezVousCommand = {
          idRendezVous: rendezVous.id
        }

        const utilisateur = unUtilisateurConseiller()

        // When
        await deleteRendezVousCommandHandler.authorize(command, utilisateur)

        // Then
        expect(
          rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune
        ).to.have.been.calledWithExactly(command.idRendezVous, utilisateur)
      })
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()
    const conseillerDto = unConseillerDto()
    const unAtelier = unRendezVousDto({
      type: CodeTypeRendezVous.ATELIER,
      createur: {
        id: conseillerDto.id,
        nom: conseillerDto.nom,
        prenom: conseillerDto.prenom
      }
    })
    const unRendezVous = unRendezVousDto({
      type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      createur: {
        id: conseillerDto.id,
        nom: conseillerDto.nom,
        prenom: conseillerDto.prenom
      }
    })

    beforeEach(async () => {
      await getDatabase().cleanPG()
      await ConseillerSqlModel.create(conseillerDto)
      await RendezVousSqlModel.bulkCreate([unAtelier, unRendezVous])
    })

    it("créé l'événement idoine quand c'etait un rdv", async () => {
      // When
      await deleteRendezVousCommandHandler.monitor(utilisateur, {
        idRendezVous: unRendezVous.id
      })

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        Evenement.Code.RDV_SUPPRIME,
        utilisateur
      )
    })

    it("créé l'événement idoine quand c'etait une AC", async () => {
      // When
      await deleteRendezVousCommandHandler.monitor(utilisateur, {
        idRendezVous: unAtelier.id
      })

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        Evenement.Code.ANIMATION_COLLECTIVE_SUPPRIMEE,
        utilisateur
      )
    })
  })
})
