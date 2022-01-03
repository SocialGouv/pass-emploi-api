import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { PlanificateurService } from '../../../src/domain/planificateur'
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
import { failure, success } from '../../../src/building-blocks/types/result'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { Notification } from '../../../src/domain/notification'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { Jeune } from '../../../src/domain/jeune'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../../src/application/commands/create-rendez-vous.command.handler'
import { IdService } from '../../../src/utils/id-service'

describe('CreateRendezVousCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let planificateurService: StubbedClass<PlanificateurService>
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)
  let idService: StubbedClass<IdService>
  let createRendezVousCommandHandler: CreateRendezVousCommandHandler
  const jeune = unJeune()
  const rendezVous = unRendezVous(jeune)

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    planificateurService = stubClass(PlanificateurService)
    idService = stubInterface(sandbox)

    createRendezVousCommandHandler = new CreateRendezVousCommandHandler(
      idService,
      rendezVousRepository,
      jeuneRepository,
      notificationRepository,
      conseillerAuthorizer,
      planificateurService
    )
  })

  describe('handle', () => {
    describe('quand le jeune n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)
        const command: CreateRendezVousCommand = {
          idJeune: jeune.id,
          idConseiller: jeune.conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.add).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauRdv(
            jeune.pushNotificationToken,
            rendezVous.id
          )
        )
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', command.idJeune))
        )
      })
    })
    describe('quand le jeune n"est pas lié au conseiller', () => {
      it('renvoie une failure', async () => {
        // Given
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
        const command: CreateRendezVousCommand = {
          idJeune: jeune.id,
          idConseiller: 'FAKE_CONSEILLER',
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.add).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauRdv(
            jeune.pushNotificationToken,
            rendezVous.id
          )
        )
        expect(result).to.deep.equal(
          failure(
            new JeuneNonLieAuConseillerError(
              command.idConseiller,
              command.idJeune
            )
          )
        )
      })
    })
    describe('quand le jeune existe et est lié au bon conseiller', () => {
      describe('quand le jeune s"est connecté au moins une fois sur l"application', () => {
        it('crée un rendez-vous, envoie une notification au jeune et planifie', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
          const command: CreateRendezVousCommand = {
            idJeune: jeune.id,
            idConseiller: jeune.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            modalite: 'tel'
          }
          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            jeune,
            idService
          )
          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
          expect(rendezVousRepository.add).to.have.been.calledWith(
            expectedRendezvous
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createNouveauRdv(
              jeune.pushNotificationToken,
              expectedRendezvous.id
            )
          )
          expect(
            planificateurService.planifierRendezVous
          ).to.have.been.calledWith(expectedRendezvous)
        })
      })
      describe('quand le jeune ne s"est jamais connecté sur l"application', () => {
        it('crée un rendez-vous sans envoyer de notifications', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
          rendezVous.jeune.pushNotificationToken = undefined
          const command: CreateRendezVousCommand = {
            idJeune: jeune.id,
            idConseiller: jeune.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            modalite: 'tel'
          }
          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            jeune,
            idService
          )
          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
          expect(rendezVousRepository.add).to.have.been.calledWith(
            expectedRendezvous
          )
          expect(notificationRepository.send).not.to.have.been.calledWith(
            Notification.createNouveauRdv(
              jeune.pushNotificationToken,
              expectedRendezvous.id
            )
          )
        })
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: CreateRendezVousCommand = {
        idJeune: jeune.id,
        idConseiller: jeune.conseiller.id,
        commentaire: rendezVous.commentaire,
        date: rendezVous.date.toDateString(),
        duree: rendezVous.duree,
        modalite: 'tel'
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await createRendezVousCommandHandler.authorize(command, utilisateur)

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur,
        command.idJeune
      )
    })
  })
})
