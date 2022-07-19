import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { isSuccess } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import {
  NotificationsPartenairesDto,
  TypeRDVPE
} from 'src/infrastructure/repositories/dto/pole-emploi.dto'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { HandleJobNotifierRendezVousPECommandHandler } from '../../../../src/application/commands/jobs/handle-job-notifier-rendez-vous-pe.command'
import { Notification } from '../../../../src/domain/notification'
import { NotificationSupport } from '../../../../src/domain/notification-support'
import { PoleEmploiClient } from '../../../../src/infrastructure/clients/pole-emploi-client'
import { DateService } from '../../../../src/utils/date-service'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobNotifierRendezVousPECommandHandler', () => {
  let sandbox: SinonSandbox
  let handleJobNotifierRendezVousPECommandHandler: HandleJobNotifierRendezVousPECommandHandler
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  let dateService: StubbedClass<DateService>
  let notificationService: StubbedClass<Notification.Service>
  let notificationSupportService: StubbedType<NotificationSupport.Service>
  const maintenant = uneDatetime
  const idConseiller = 'test'
  const jeune = unJeuneDto({
    idConseiller,
    structure: Core.Structure.POLE_EMPLOI
  })

  beforeEach(async () => {
    DatabaseForTesting.prepare()
    sandbox = createSandbox()
    poleEmploiClient = stubClass(PoleEmploiClient)
    dateService = stubClass(DateService)
    notificationService = stubClass(Notification.Service)
    notificationSupportService = stubInterface(sandbox)

    dateService.now.returns(maintenant)

    handleJobNotifierRendezVousPECommandHandler =
      new HandleJobNotifierRendezVousPECommandHandler(
        poleEmploiClient,
        notificationService,
        dateService,
        notificationSupportService
      )

    await ConseillerSqlModel.upsert(unConseillerDto({ id: idConseiller }))
    await JeuneSqlModel.upsert(jeune)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('traite les notifications PE des deux dernières heures seulement', async () => {
      // Given
      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      const notificationsPartenairesPE: NotificationsPartenairesDto = {
        listeNotificationsPartenaires: [
          {
            idExterneDE: jeune.idAuthentification,
            notifications: [
              {
                idNotification: '33e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.CREA,
                typeRDV: 'CONVOCATIONS',
                dateCreation: maintenant.minus({ hour: 1 }).toISO(),
                idMetier: 'idMetier1'
              },
              {
                idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.SUPP,
                typeRDV: 'CONVOCATIONS',
                dateCreation: maintenant.minus({ hour: 3 }).toISO(),
                idMetier: 'idMetier1'
              },
              {
                idNotification: '35e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.SUPP,
                typeRDV: 'CONVOCATIONS',
                dateCreation: maintenant.plus({ hour: 1 }).toISO(),
                idMetier: 'idMetier1'
              }
            ]
          }
        ]
      }
      poleEmploiClient.getNotificationsRDV
        .withArgs([jeune.idAuthentification], dateHier, dateAujourdhui)
        .resolves(notificationsPartenairesPE)

      // When
      const result = await handleJobNotifierRendezVousPECommandHandler.handle()

      // Then
      expect(
        notificationService.notifierLeJeuneDuRDV
      ).to.have.been.calledOnceWithExactly(
        jeune.id,
        Notification.Type.NEW_RENDEZVOUS,
        'idMetier1',
        undefined,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        jeune.pushNotificationToken
      )

      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.jeunesPEAvecToken).to.equal(1)
        expect(result.data.nombreJeunesTraites).to.equal(1)
        expect(result.data.nombreNotificationsEnvoyees).to.equal(1)
        expect(result.data.erreurs).to.equal(0)
      }
    })
    it('traite les notifications PE à minuit', async () => {
      // Given
      const dateMinuit = DateTime.fromISO('2020-04-06T00:30:00.000Z').toUTC()
      dateService.now.returns(dateMinuit)

      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      const notificationsPartenairesPE: NotificationsPartenairesDto = {
        listeNotificationsPartenaires: [
          {
            idExterneDE: jeune.idAuthentification,
            notifications: [
              {
                idNotification: '33e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.CREA,
                typeRDV: 'CONVOCATIONS',
                dateCreation: dateMinuit.minus({ hour: 1 }).toISO(),
                idMetier: 'idMetier1'
              },
              {
                idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.SUPP,
                typeRDV: 'CONVOCATIONS',
                dateCreation: dateMinuit.minus({ minutes: 20 }).toISO()
              },
              {
                idNotification: '34e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.SUPP,
                typeRDV: 'CONVOCATIONS',
                dateCreation: dateMinuit.minus({ hour: 3 }).toISO(),
                idMetier: 'idMetier3'
              },
              {
                idNotification: '35e3e6b9cfdf486fbf28fda1d4d362f6',
                codeNotification: 'AGENDA_NOUVEAU_RDV',
                message:
                  'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
                typeMouvementRDV: TypeRDVPE.SUPP,
                typeRDV: 'CONVOCATIONS',
                dateCreation: dateMinuit.plus({ hour: 1 }).toISO(),
                idMetier: 'idMetier4'
              }
            ]
          }
        ]
      }
      poleEmploiClient.getNotificationsRDV
        .withArgs([jeune.idAuthentification], dateHier, dateAujourdhui)
        .resolves(notificationsPartenairesPE)

      // When
      const result = await handleJobNotifierRendezVousPECommandHandler.handle()

      // Then
      expect(
        notificationService.notifierLeJeuneDuRDV
      ).to.have.been.calledTwice()
      expect(
        notificationService.notifierLeJeuneDuRDV.getCall(0).args
      ).to.deep.equal([
        jeune.id,
        Notification.Type.NEW_RENDEZVOUS,
        'idMetier1',
        undefined,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        jeune.pushNotificationToken
      ])
      expect(
        notificationService.notifierLeJeuneDuRDV.getCall(1).args
      ).to.deep.equal([
        jeune.id,
        Notification.Type.DELETED_RENDEZVOUS,
        undefined,
        undefined,
        'Prochain RDV le 14/02/2022 à 14:30. Voir mon rendez-vous.',
        jeune.pushNotificationToken
      ])
      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.jeunesPEAvecToken).to.equal(1)
        expect(result.data.nombreJeunesTraites).to.equal(1)
        expect(result.data.nombreNotificationsEnvoyees).to.equal(2)
        expect(result.data.erreurs).to.equal(0)
      }
    })
    it("catch l'erreur d'appel api", async () => {
      // Given
      const dateHier = '2020-04-05'
      const dateAujourdhui = '2020-04-06'
      poleEmploiClient.getNotificationsRDV
        .withArgs([jeune.idAuthentification], dateHier, dateAujourdhui)
        .rejects()

      // When
      const result = await handleJobNotifierRendezVousPECommandHandler.handle()

      // Then
      expect(notificationService.notifierLeJeuneDuRDV).not.to.have.been.called()

      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.jeunesPEAvecToken).to.equal(1)
        expect(result.data.nombreJeunesTraites).to.equal(0)
        expect(result.data.nombreNotificationsEnvoyees).to.equal(0)
        expect(result.data.erreurs).to.equal(1)
      }
    })
  })
})
