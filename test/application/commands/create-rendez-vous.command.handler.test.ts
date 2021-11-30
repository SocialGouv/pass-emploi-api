import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass
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
  let idService: StubbedClass<IdService>
  let createRendezVousCommandHandler: CreateRendezVousCommandHandler
  const jeune = unJeune()
  const rendezVous = unRendezVous(jeune)
  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    idService = stubInterface(sandbox)
    createRendezVousCommandHandler = new CreateRendezVousCommandHandler(
      idService,
      rendezVousRepository,
      jeuneRepository,
      notificationRepository
    )
  })
  describe('execute', () => {
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
        const result = await createRendezVousCommandHandler.execute(command)
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
        const result = await createRendezVousCommandHandler.execute(command)
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
        it('crée un rendez-vous et envoie une notification au jeune', async () => {
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
          const result = await createRendezVousCommandHandler.execute(command)
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
          const result = await createRendezVousCommandHandler.execute(command)
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
})
