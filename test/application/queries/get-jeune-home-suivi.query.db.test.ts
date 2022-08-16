import { GetJeuneHomeSuiviQueryHandler } from 'src/application/queries/get-jeune-home-suivi.query.db'
import { JeuneHomeSuiviQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { success } from 'src/building-blocks/types/result'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { uneActionQueryModel } from 'test/fixtures/query-models/action.query-model.fixtures'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { expect } from '../../utils'

describe('GetJeuneHomeSuiviQueryHandler', () => {
  DatabaseForTesting.prepare()
  let handler: GetJeuneHomeSuiviQueryHandler

  beforeEach(() => {
    handler = new GetJeuneHomeSuiviQueryHandler()
  })

  describe.only('handle', () => {

    describe('actions', () => {

        it('doit retourner la liste des actions', async () => {
            // Given
            await ConseillerSqlModel.creer(unConseillerDto())
            await JeuneSqlModel.creer(unJeuneDto())
            await ActionSqlModel.creer(uneActionDto())

            // When
            const result = await handler.handle({idJeune: "ABCDE"})

            // Then
            const expected: JeuneHomeSuiviQueryModel = {actions: [uneActionQueryModel()]}
            expect(result).to.deep.equal(success(expected))
        })
    })
  })
})
