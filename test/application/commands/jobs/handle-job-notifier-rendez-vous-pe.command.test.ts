import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import {
  HandleJobNotifierRendezVousPECommandHandler,
  Stats
} from '../../../../src/application/commands/jobs/handle-job-notifier-rendez-vous-pe.command'
import { Notification } from '../../../../src/domain/notification/notification'
import { NotificationSupport } from '../../../../src/domain/notification-support'
import { PoleEmploiClient } from '../../../../src/infrastructure/clients/pole-emploi-client'
import { DateService } from '../../../../src/utils/date-service'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { unJeune } from '../../../fixtures/jeune.fixture'

describe('HandleJobNotifierRendezVousPECommandHandler', () => {
  let sandbox: SinonSandbox
  let handleJobNotifierRendezVousPECommandHandler: HandleJobNotifierRendezVousPECommandHandler
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  let dateService: StubbedClass<DateService>
  let notificationService: StubbedClass<Notification.Service>
  let notificationSupportService: StubbedType<NotificationSupport.Service>
  let jeunePoleEmploiRepository: StubbedType<Jeune.PoleEmploi.Repository>

  const maintenant = uneDatetime

  const jeune: Jeune = unJeune()
  const jeunePoleEmploi: Jeune.PoleEmploi = {
    id: jeune.id,
    idAuthentification: 'idAuthentification',
    pushNotificationToken: jeune.configuration!.pushNotificationToken!
  }

  beforeEach(async () => {
    sandbox = createSandbox()
    poleEmploiClient = stubClass(PoleEmploiClient)
    dateService = stubClass(DateService)
    jeunePoleEmploiRepository = stubInterface(sandbox)
    notificationService = stubClass(Notification.Service)
    notificationSupportService = stubInterface(sandbox)

    dateService.now.returns(maintenant)
    jeunePoleEmploiRepository.findAll.resolves([jeunePoleEmploi])

    handleJobNotifierRendezVousPECommandHandler =
      new HandleJobNotifierRendezVousPECommandHandler(
        poleEmploiClient,
        notificationService,
        dateService,
        notificationSupportService,
        jeunePoleEmploiRepository
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('traite les notifications PE des deux dernières heures seulement', async () => {
      // Given
      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      const notificationsPoleEmploi: Notification.PoleEmploi[] = [
        {
          idExterneDE: jeunePoleEmploi.idAuthentification,
          notifications: [
            {
              idNotification: '33e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message:
                'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
              typeMouvementRDV: Notification.Type.NEW_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: maintenant.minus({ hour: 1 }),
              idMetier: 'idMetier1'
            },
            {
              idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 09:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: maintenant.minus({ hour: 3 }),
              idMetier: 'idMetier1'
            },
            {
              idNotification: '35e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 14/02/2022 09:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: maintenant.plus({ hour: 1 }),
              idMetier: 'idMetier1'
            }
          ]
        }
      ]
      poleEmploiClient.getNotificationsRendezVous
        .withArgs(
          [jeunePoleEmploi.idAuthentification],
          dateHier,
          dateAujourdhui
        )
        .resolves(notificationsPoleEmploi)

      // When
      const result = await handleJobNotifierRendezVousPECommandHandler.handle()

      // Then
      expect(
        notificationService.notifierUnRendezVousPoleEmploi
      ).to.have.been.calledOnceWithExactly(
        Notification.Type.NEW_RENDEZVOUS,
        jeunePoleEmploi.pushNotificationToken,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        'idMetier1'
      )

      const stats: Stats = {
        jeunesPEAvecToken: 1,
        nombreJeunesTraites: 1,
        nombreNotificationsEnvoyees: 1,
        erreurs: 0
      }
      expect(result._isSuccess && result.data)
        .excluding('tempsDExecution')
        .to.deep.equal(stats)
    })

    it('traite les notifications PE à minuit', async () => {
      // Given
      const dateMinuit = DateTime.fromISO('2020-04-06T00:30:00.000Z').toUTC()
      dateService.now.returns(dateMinuit)

      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      const notificationsPartenairesPE: Notification.PoleEmploi[] = [
        {
          idExterneDE: jeunePoleEmploi.idAuthentification,
          notifications: [
            {
              idNotification: '33e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message:
                'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
              typeMouvementRDV: Notification.Type.NEW_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.minus({ hour: 1 }),
              idMetier: 'idMetier1'
            },
            {
              idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 11:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.minus({ minutes: 20 })
            },
            {
              idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 09:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.minus({ hour: 3 }),
              idMetier: 'idMetier3'
            },
            {
              idNotification: '35e3e6b9cfdf486fbf28fda1d4d362f6',
              codeNotification: 'AGENDA_NOUVEAU_RDV',
              message: 'Le rendez-vous du 06/09/2022 08:30 a été supprimé',
              typeMouvementRDV: Notification.Type.DELETED_RENDEZVOUS,
              typeRDV: 'CONVOCATIONS',
              dateCreation: dateMinuit.plus({ hour: 1 }),
              idMetier: 'idMetier4'
            }
          ]
        }
      ]
      poleEmploiClient.getNotificationsRendezVous
        .withArgs(
          [jeunePoleEmploi.idAuthentification],
          dateHier,
          dateAujourdhui
        )
        .resolves(notificationsPartenairesPE)

      // When
      const result = await handleJobNotifierRendezVousPECommandHandler.handle()

      // Then
      expect(
        notificationService.notifierUnRendezVousPoleEmploi
      ).to.have.been.calledTwice()
      expect(
        notificationService.notifierUnRendezVousPoleEmploi.getCall(0).args
      ).to.deep.equal([
        Notification.Type.NEW_RENDEZVOUS,
        jeunePoleEmploi.pushNotificationToken,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        'idMetier1'
      ])
      expect(
        notificationService.notifierUnRendezVousPoleEmploi.getCall(1).args
      ).to.deep.equal([
        Notification.Type.DELETED_RENDEZVOUS,
        jeunePoleEmploi.pushNotificationToken,
        'Le rendez-vous du 06/09/2022 11:30 a été supprimé',
        undefined
      ])

      const stats: Stats = {
        jeunesPEAvecToken: 1,
        nombreJeunesTraites: 1,
        nombreNotificationsEnvoyees: 2,
        erreurs: 0
      }
      expect(result._isSuccess && result.data)
        .excluding('tempsDExecution')
        .to.deep.equal(stats)
    })
    it("catch l'erreur d'appel api", async () => {
      // Given
      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      poleEmploiClient.getNotificationsRendezVous
        .withArgs(
          [jeunePoleEmploi.idAuthentification],
          dateHier,
          dateAujourdhui
        )
        .rejects()

      // When
      const result = await handleJobNotifierRendezVousPECommandHandler.handle()

      // Then
      expect(
        notificationService.notifierUnRendezVousPoleEmploi
      ).not.to.have.been.called()

      const stats: Stats = {
        jeunesPEAvecToken: 1,
        nombreJeunesTraites: 0,
        nombreNotificationsEnvoyees: 0,
        erreurs: 1
      }
      expect(result._isSuccess && result.data)
        .excluding('tempsDExecution')
        .to.deep.equal(stats)
    })
  })
})
