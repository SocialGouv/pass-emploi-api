import { GetJeuneHomeSuiviQueryHandler } from 'src/application/queries/get-jeune-home-suivi.query.db'
import { JeuneHomeSuiviQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { success } from 'src/building-blocks/types/result'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { uneActionQueryModelSansJeune } from 'test/fixtures/query-models/action.query-model.fixtures'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { expect } from '../../utils'

describe('GetJeuneHomeSuiviQueryHandler', () => {
  DatabaseForTesting.prepare()
  let handler: GetJeuneHomeSuiviQueryHandler
  const hier = new Date('2022-08-14T12:00:00Z')
  const aujourdhui = new Date('2022-08-15T12:00:00Z')
  const demain = new Date('2022-08-16T12:00:00Z')
  const apresDemain = new Date('2022-08-17T12:00:00Z')

  beforeEach(() => {
    handler = new GetJeuneHomeSuiviQueryHandler()
  })

  describe('handle', () => {
    describe('actions', () => {
      const uneActionDtoQuiDateDHier = uneActionDto({
        dateEcheance: hier
      })
      const uneActionDtoPourDemain = uneActionDto({
        dateEcheance: demain
      })
      const uneActionDtoPourApresDemain = uneActionDto({
        dateEcheance: apresDemain
      })

      beforeEach(async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto())
        await JeuneSqlModel.creer(unJeuneDto())
        await ActionSqlModel.creer(uneActionDtoQuiDateDHier)
        await ActionSqlModel.creer(uneActionDtoPourApresDemain)
        await ActionSqlModel.creer(uneActionDtoPourDemain)
      })
      it('doit retourner la liste des actions triées chronologiquement', async () => {
        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          dateDebut: aujourdhui,
          dateFin: apresDemain
        })

        // Then
        const expected: JeuneHomeSuiviQueryModel = {
          actions: [
            uneActionQueryModelSansJeune({
              id: uneActionDtoPourDemain.id,
              dateEcheance: demain.toISOString()
            }),
            uneActionQueryModelSansJeune({
              id: uneActionDtoPourApresDemain.id,
              dateEcheance: apresDemain.toISOString()
            })
          ]
        }
        expect(result).to.deep.equal(success(expected))
      })
      it('retourne uniquement les actions filtrées sur la dates données', async () => {
        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          dateDebut: aujourdhui,
          dateFin: demain
        })

        // Then
        const expected: JeuneHomeSuiviQueryModel = {
          actions: [
            uneActionQueryModelSansJeune({
              id: uneActionDtoPourDemain.id,
              dateEcheance: demain.toISOString()
            })
          ]
        }
        expect(result).to.deep.equal(success(expected))
      })
    })
  })
})
