import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
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

describe('DeleteRendezVousCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  let deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  let planificateurService: StubbedClass<PlanificateurService>
  let evenementService: StubbedClass<EvenementService>
  const jeune = unJeune()
  const rendezVous = unRendezVous({}, jeune)

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    evenementService = stubClass(EvenementService)

    deleteRendezVousCommandHandler = new DeleteRendezVousCommandHandler(
      rendezVousRepository,
      notificationRepository,
      rendezVousAuthorizer,
      planificateurService,
      evenementService
    )
  })

  describe('handle', () => {
    describe('quand le rendez-vous existe', () => {
      describe('quand le jeune s"est déjà connecté au moins une fois sur l"application', () => {
        it('supprime le rendezvous et envoit une notification au jeune', async () => {
          // Given
          rendezVous.jeunes[0].pushNotificationToken = 'token'
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
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createRdvSupprime(
              rendezVous.jeunes[0].pushNotificationToken,
              rendezVous.date
            )
          )
          expect(result).to.deep.equal(emptySuccess())
        })
      })
      describe('quand le jeune ne s"est jamais connecté sur l"application', () => {
        it('supprime le rendez-vous sans envoyer de notification au jeune', async () => {
          // Given
          rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
          rendezVous.jeunes[0].pushNotificationToken = undefined
          const command: DeleteRendezVousCommand = {
            idRendezVous: rendezVous.id
          }

          // When
          const result = await deleteRendezVousCommandHandler.handle(command)
          // Then
          expect(rendezVousRepository.delete).to.have.been.calledWith(
            rendezVous.id
          )
          expect(notificationRepository.send).not.to.have.been.calledWith(
            Notification.createRdvSupprime(
              jeune.pushNotificationToken,
              rendezVous.date
            )
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
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createRdvSupprime(
            jeune.pushNotificationToken,
            rendezVous.date
          )
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
