import { FirebaseClient } from 'src/infrastructure/clients/firebase-client'
import { MatomoClient } from 'src/infrastructure/clients/matomo-client'
import { NotificationFirebaseSqlRepository } from 'src/infrastructure/repositories/notification-firebase.repository.db'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { StubbedClass, stubClass } from '../../utils'
import { uneDatetime } from '../../fixtures/date.fixture'
import { expect } from 'chai'
import { getDatabase } from '../../utils/database-for-testing'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { Notification } from '../../../src/domain/notification/notification'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { NotificationJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/notification-jeune.sql-model'

describe('NotificationFirebaseSqlRepository', () => {
  let repository: NotificationFirebaseSqlRepository
  let firebaseClient: StubbedClass<FirebaseClient>
  let matomoClient: StubbedClass<MatomoClient>
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>
  const maintenant = uneDatetime()
  const unId = 'uuid-123'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    firebaseClient = stubClass(FirebaseClient)
    matomoClient = stubClass(MatomoClient)
    idService = stubClass(IdService)
    dateService = stubClass(DateService)
    idService.uuid.returns(unId)
    dateService.now.returns(maintenant)

    repository = new NotificationFirebaseSqlRepository(
      firebaseClient,
      matomoClient,
      idService,
      dateService
    )

    await ConseillerSqlModel.bulkCreate([
      unConseillerDto({
        id: 'con1'
      })
    ])
    // Jeunes
    await JeuneSqlModel.bulkCreate([
      unJeuneDto({
        id: 'j1',
        idConseiller: 'con1',
        pushNotificationToken: 'push1'
      })
    ])
  })

  describe('send', () => {
    const message: Notification.Message = {
      token: 'push1',
      notification: {
        title: 'Titre',
        body: 'Description'
      },
      data: {
        type: 'OUTILS'
      }
    }

    it('persiste une notification en base quand idJeune est fourni', async () => {
      async function waitFor<T>(
        callback: () => Promise<T>,
        { timeout = 1000, interval = 50 } = {}
      ): Promise<T> {
        const start = Date.now()
        while (true) {
          try {
            return await callback()
          } catch (e) {
            if (Date.now() - start > timeout) throw e
            await new Promise(r => setTimeout(r, interval))
          }
        }
      }

      // When
      await repository.send(message, 'j1')

      // Then
      const notif = await waitFor(async () => {
        const notif = await NotificationJeuneSqlModel.findOne({
          where: { idJeune: 'j1' }
        })
        expect(notif).to.not.be.null()
        return notif
      })
      expect(notif!.id).to.equal(unId)
      expect(notif!.idJeune).to.equal('j1')
      expect(notif!.type).to.equal('OUTILS')
      expect(notif!.titre).to.equal('Titre')
      expect(notif!.description).to.equal('Description')
      expect(notif!.idObjet).to.be.null()
      expect(notif!.dateNotif).to.deep.equal(maintenant.toJSDate())
    })

    it("n'enregistre rien si idJeune n'est pas fourni", async () => {
      // When
      await repository.send(message)

      // Then
      expect(await NotificationJeuneSqlModel.findAll()).to.be.empty()
    })

    it('envoie aussi une notification push si pushNotification = true', async () => {
      // When
      await repository.send(message, 'j1', true)

      // Then
      expect(firebaseClient.send).to.have.been.calledOnceWithExactly(message)
      expect(
        matomoClient.trackEventPushNotificationEnvoyee
      ).to.have.been.calledOnceWithExactly(message)
    })

    it('envoie une notification push si pushNotification non fourni', async () => {
      // When
      await repository.send(message, 'j1')

      // Then
      expect(firebaseClient.send).to.have.been.calledOnceWithExactly(message)
      expect(
        matomoClient.trackEventPushNotificationEnvoyee
      ).to.have.been.calledOnceWithExactly(message)
    })

    it("n'envoie pas de notification push si pushNotification = false", async () => {
      // When
      await repository.send(message, 'j1', false)

      // Then
      expect(firebaseClient.send).not.to.have.been.called()
      expect(
        matomoClient.trackEventPushNotificationEnvoyee
      ).not.to.have.been.called()
    })
  })
})
