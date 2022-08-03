import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { uneAction } from 'test/fixtures/action.fixture'
import {
  uneConfiguration,
  unJeune,
  unJeuneSansPushNotificationToken
} from 'test/fixtures/jeune.fixture'
import { uneNotification } from 'test/fixtures/notification.fixture'
import { uneRecherche } from 'test/fixtures/recherche.fixture'
import { unRendezVous } from 'test/fixtures/rendez-vous.fixture'
import { Notification } from '../../src/domain/notification'
import { createSandbox, expect } from '../utils'
import { Jeune } from '../../src/domain/jeune/jeune'

describe('Notification', () => {
  describe('Service', () => {
    let notificationService: Notification.Service
    let notificationRepository: StubbedType<Notification.Repository>

    beforeEach(() => {
      const sandbox = createSandbox()
      notificationRepository = stubInterface(sandbox)
      notificationService = new Notification.Service(notificationRepository)
    })

    describe('notifierLesJeunesDuRdv', () => {
      it('notifie les jeunes avec pushNotificationToken du nouveau rdv', async () => {
        // Given
        const rdv = unRendezVous({
          jeunes: [unJeune(), unJeuneSansPushNotificationToken()]
        })
        const typeNotification = Notification.Type.NEW_RENDEZVOUS
        const expectedNotification = uneNotification({
          token: rdv.jeunes[0].configuration?.pushNotificationToken,
          notification: {
            title: 'Nouveau rendez-vous',
            body: 'Votre conseiller a programmé un nouveau rendez-vous'
          },
          data: {
            type: typeNotification,
            id: rdv.id
          }
        })

        // When
        await notificationService.notifierLesJeunesDuRdv(rdv, typeNotification)

        // Then
        expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
          expectedNotification
        )
      })
      it('notifie les jeunes avec pushNotificationToken du rdv modifié', async () => {
        // Given
        const rdv = unRendezVous({
          jeunes: [unJeune(), unJeuneSansPushNotificationToken()]
        })
        const typeNotification = Notification.Type.UPDATED_RENDEZVOUS
        const expectedNotification = uneNotification({
          token: rdv.jeunes[0].configuration?.pushNotificationToken,
          notification: {
            title: 'Rendez-vous modifié',
            body: 'Votre rendez-vous a été modifié'
          },
          data: {
            type: Notification.Type.NEW_RENDEZVOUS,
            id: rdv.id
          }
        })

        // When
        await notificationService.notifierLesJeunesDuRdv(rdv, typeNotification)

        // Then
        expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
          expectedNotification
        )
      })
      it('notifie les jeunes avec pushNotificationToken du rdv supprimé', async () => {
        // Given
        const rdv = unRendezVous({
          jeunes: [unJeune(), unJeuneSansPushNotificationToken()]
        })
        const typeNotification = Notification.Type.DELETED_RENDEZVOUS
        const expectedNotification = uneNotification({
          token: rdv.jeunes[0].configuration?.pushNotificationToken,
          notification: {
            title: 'Rendez-vous supprimé',
            body: `Votre rendez-vous du 11/11 est supprimé`
          },
          data: {
            type: typeNotification
          }
        })

        // When
        await notificationService.notifierLesJeunesDuRdv(rdv, typeNotification)

        // Then
        expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
          expectedNotification
        )
      })
    })
    describe('notifierLesJeunesDuNouveauMessage', () => {
      it('notifie les jeunes avec pushNotificationToken', async () => {
        // Given
        const jeunes: Jeune[] = [unJeune(), unJeuneSansPushNotificationToken()]
        const expectedNotification = uneNotification({
          token: jeunes[0].configuration!.pushNotificationToken
        })

        // When
        await notificationService.notifierLesJeunesDuNouveauMessage(jeunes)

        // Then
        expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
          expectedNotification
        )
      })
    })
    describe('notifierNouvelleAction', () => {
      it('notifie les jeunes avec pushNotificationToken', async () => {
        // Given
        const jeune: Jeune = unJeune()
        const action = uneAction()
        const expectedNotification = uneNotification({
          token: jeune.configuration?.pushNotificationToken,
          notification: {
            title: 'Nouvelle action',
            body: 'Vous avez une nouvelle action'
          },
          data: {
            type: Notification.Type.NEW_ACTION,
            id: action.id
          }
        })

        // When
        await notificationService.notifierNouvelleAction(jeune, action)

        // Then
        expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
          expectedNotification
        )
      })
    })
    describe('notifierNouvellesOffres', () => {
      it('notifie les jeunes avec pushNotificationToken', async () => {
        // Given
        const configuration = uneConfiguration()
        const recherche = uneRecherche()
        const expectedNotification = uneNotification({
          token: configuration.pushNotificationToken,
          notification: {
            title: recherche.titre,
            body: 'De nouveaux résultats sont disponibles'
          },
          data: {
            type: Notification.Type.NOUVELLE_OFFRE,
            id: recherche.id
          }
        })

        // When
        await notificationService.notifierNouvellesOffres(
          recherche,
          configuration
        )

        // Then
        expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
          expectedNotification
        )
      })
    })
  })
})
