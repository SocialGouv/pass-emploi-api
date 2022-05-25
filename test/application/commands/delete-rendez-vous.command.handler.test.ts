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
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { Mail } from '../../../src/domain/mail'
import { Conseiller } from '../../../src/domain/conseiller'

describe('DeleteRendezVousCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let notificationService: StubbedType<Notification.Service>
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
    notificationService = stubInterface(sandbox)
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
    it('renvoie une failure pour un rendez-vous inexistant', async () => {
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
      expect(notificationService.envoyer).not.to.have.been.calledWith(
        Notification.createRdvSupprime(
          jeune.pushNotificationToken,
          rendezVous.date
        )
      )
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
      )
    })
    it('supprime un rendez-vous existant', async () => {
      const command: DeleteRendezVousCommand = {
        idRendezVous: rendezVous.id
      }
      rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
      // When
      const result = await deleteRendezVousCommandHandler.handle(command)
      // Then
      expect(rendezVousRepository.delete).to.have.been.calledWith(rendezVous.id)
      expect(result).to.deep.equal(emptySuccess())
    })
    describe('notifications', () => {
      it("envoie un email au créateur d'un rendez-vous avec invitation", async () => {
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
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
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
      it("n'envoie pas d'email au créateur d'un rendez-vous sans invitation", async () => {
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
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
        conseillerRepository.get
          .withArgs(conseillerCreateur.id)
          .resolves(conseillerCreateur)
        planificateurService.supprimerRappelsRendezVous.resolves()

        // When
        await deleteRendezVousCommandHandler.handle(command)

        // Then
        expect(mailService.envoyerMailRendezVous).not.to.have.been.called()
      })
      it("envoie une notification push à un jeune qui s'est déjà connecté sur l'application", async () => {
        // Given
        rendezVous.jeunes[0].pushNotificationToken = 'token'
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
        const command: DeleteRendezVousCommand = {
          idRendezVous: rendezVous.id
        }

        // When
        await deleteRendezVousCommandHandler.handle(command)

        // Then
        expect(
          notificationService.envoyerNotificationPush
        ).to.have.been.calledWith(rendezVous.jeunes[0], {
          type: Notification.Type.DELETED_RENDEZVOUS,
          date: rendezVous.date
        })
      })
      it("n'envoie pas de notification à un jeune qui ne s'est jamais connecté sur l'application", async () => {
        // Given
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
        rendezVous.jeunes[0].pushNotificationToken = undefined
        const command: DeleteRendezVousCommand = {
          idRendezVous: rendezVous.id
        }
        // When
        await deleteRendezVousCommandHandler.handle(command)
        // Then
        expect(
          notificationService.envoyerNotificationPush
        ).not.to.have.been.called()
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
