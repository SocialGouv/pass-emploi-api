import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { Notification } from '../../../src/domain/notification'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { EvenementService } from 'src/domain/evenement'
import { PlanificateurService } from 'src/domain/planificateur'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { Mail } from '../../../src/domain/mail'
import { Conseiller } from '../../../src/domain/conseiller'
import { stubClassSandbox } from 'test/utils/types'

describe('DeleteRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  let deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  let planificateurService: StubbedClass<PlanificateurService>
  let mailService: StubbedType<Mail.Service>
  let evenementService: StubbedClass<EvenementService>
  const jeune = unJeune()
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
      describe("quand l'invitation est à true", () => {
        describe('quand le conseiller qui supprime est différent du créateur', () => {
          it('envoie un email au créateur du rendez-vous', async () => {
            // Given
            const conseillerSuppression = unConseiller({
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
            planificateurService.supprimerRappelsRendezVous.resolves()

            // When
            await deleteRendezVousCommandHandler.handle(command)

            // Then
            expect(mailService.envoyerMailRendezVous).to.have.been.calledWith(
              conseillerCreateur,
              rendezVous,
              RendezVous.Operation.SUPPRESSION
            )
          })
        })
        describe("quand l'invitation est à false", () => {
          it("n'envoie pas d'email au conseiller créateur", async () => {
            // Given
            const conseillerSuppression = unConseiller({
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
            rendezVousRepository.get
              .withArgs(rendezVous.id)
              .resolves(rendezVous)
            conseillerRepository.get
              .withArgs(conseillerCreateur.id)
              .resolves(conseillerCreateur)
            planificateurService.supprimerRappelsRendezVous.resolves()

            // When
            await deleteRendezVousCommandHandler.handle(command)

            // Then
            expect(mailService.envoyerMailRendezVous).not.to.have.been.called()
          })
        })
        describe("quand le jeune s'est déjà connecté au moins une fois sur l'application", () => {
          it('supprime le rendez-vous et envoie une notification au jeune', async () => {
            // Given
            rendezVous.jeunes[0].pushNotificationToken = 'token'
            rendezVousRepository.get
              .withArgs(rendezVous.id)
              .resolves(rendezVous)
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
      describe('quand le rendez-vous n"existe pas', () => {
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
        expect(rendezVousAuthorizer.authorize).to.have.been.calledWithExactly(
          command.idRendezVous,
          utilisateur
        )
      })
    })
  })
})
