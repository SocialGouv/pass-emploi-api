import { expect, StubbedClass, stubClass } from 'test/utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  GetNotificationsJeuneQueryHandler,
  NotificationJeuneQueryModel
} from '../../../src/application/queries/get-notifications-jeune.query.handler.db'
import { success } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { NotificationJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/notification-jeune.sql-model'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../utils/database-for-testing'

const jeune: Jeune = unJeune({
  conseiller: unConseillerDuJeune({ idAgence: undefined })
})
const conseillerDto = unConseillerDto({ id: jeune.conseiller!.id })
const jeuneDto = unJeuneDto({
  id: jeune.id,
  idConseiller: conseillerDto.id
})

describe('GetNotificationsJeuneQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let queryHandler: GetNotificationsJeuneQueryHandler

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    queryHandler = new GetNotificationsJeuneQueryHandler(jeuneAuthorizer)

    await ConseillerSqlModel.creer(conseillerDto)
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it('renvoie les notifs du jeune', async () => {
      // Given
      await NotificationJeuneSqlModel.bulkCreate([
        {
          id: '5cd8e86b-175a-4980-bad8-c5ce01dc049b',
          idJeune: jeune.id,
          dateNotif: uneDatetime().toJSDate(),
          type: 'test',
          titre: 'test',
          description: 'test',
          idObjet: null
        },
        {
          id: '5cd8e86b-175a-4980-bad8-c5ce01dc049c',
          idJeune: jeune.id,
          dateNotif: uneDatetime().toJSDate(),
          type: 'test',
          titre: 'test',
          description: 'test',
          idObjet: null
        }
      ])

      // When
      const result = await queryHandler.handle({
        idJeune: jeune.id
      })

      // Then
      const attendu: NotificationJeuneQueryModel[] = [
        {
          date: '2020-04-06T12:00:00.000Z',
          description: 'test',
          id: '5cd8e86b-175a-4980-bad8-c5ce01dc049b',
          idObjet: undefined,
          titre: 'test',
          type: 'test'
        },
        {
          date: '2020-04-06T12:00:00.000Z',
          description: 'test',
          id: '5cd8e86b-175a-4980-bad8-c5ce01dc049c',
          idObjet: undefined,
          titre: 'test',
          type: 'test'
        }
      ]
      expect(result).to.deep.equal(success(attendu))
    })
  })

  describe('authorize', () => {
    it('n’autorise que le jeune', () => {
      // Given
      const idJeune = 'id-jeune'

      // When
      queryHandler.authorize({ idJeune }, unUtilisateurJeune({ id: idJeune }))

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly(
        idJeune,
        unUtilisateurJeune({ id: idJeune })
      )
    })
  })
})
