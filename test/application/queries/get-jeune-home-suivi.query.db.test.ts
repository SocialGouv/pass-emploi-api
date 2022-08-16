import { GetJeuneHomeSuiviQueryHandler } from 'src/application/queries/get-jeune-home-suivi.query.db'
import { JeuneHomeSuiviQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { success } from 'src/building-blocks/types/result'
import {
  ActionDto,
  ActionSqlModel
} from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { uneActionQueryModelSansJeune } from 'test/fixtures/query-models/action.query-model.fixtures'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { expect } from '../../utils'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

describe('GetJeuneHomeSuiviQueryHandler', () => {
  DatabaseForTesting.prepare()
  let handler: GetJeuneHomeSuiviQueryHandler
  const aujourdhuiVendredi = '2022-08-12T12:00:00Z'
  const demain = new Date('2022-08-13T12:00:00Z')
  const apresDemain = new Date('2022-08-14T12:00:00Z')
  const jeuneDto = unJeuneDto()

  beforeEach(async () => {
    handler = new GetJeuneHomeSuiviQueryHandler()
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it("doit retourner les événements bornés entre samedi dernier minuit et samedi en huit minuit, d'après la locale utilisateur", async () => {
      const aujourdhuiLundi = '2022-08-15T00:00:00-07:00'
      const [_vendrediDernier, samediDernier, vendrediEnHuit, _samediEnHuit] =
        await createActions([
          '2022-08-12T23:59:00-07:00',
          '2022-08-13T00:00:00-07:00',
          '2022-08-26T23:59:00-07:00',
          '2022-08-27T00:00:00-07:00'
        ])

      // When
      const result = await handler.handle({
        idJeune: 'ABCDE',
        maintenant: aujourdhuiLundi
      })

      // Then
      const expected: JeuneHomeSuiviQueryModel = {
        actions: [
          uneActionQueryModelSansJeune({
            id: samediDernier.id,
            dateEcheance: samediDernier.dateEcheance.toISOString()
          }),
          uneActionQueryModelSansJeune({
            id: vendrediEnHuit.id,
            dateEcheance: vendrediEnHuit.dateEcheance.toISOString()
          })
        ],
        rendezVous: []
      }
      expect(result).to.deep.equal(success(expected))
    })

    describe('actions', () => {
      it('doit retourner la liste des actions triées chronologiquement', async () => {
        const [demain, apresDemain] = await createActions([
          '2022-08-13T12:00:00Z',
          '2022-08-14T12:00:00Z'
        ])

        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          maintenant: aujourdhuiVendredi
        })

        // Then
        const expected: JeuneHomeSuiviQueryModel = {
          actions: [
            uneActionQueryModelSansJeune({
              id: demain.id,
              dateEcheance: demain.dateEcheance.toISOString()
            }),
            uneActionQueryModelSansJeune({
              id: apresDemain.id,
              dateEcheance: apresDemain.dateEcheance.toISOString()
            })
          ],
          rendezVous: []
        }
        expect(result).to.deep.equal(success(expected))
      })
    })
    describe('rendez-vous', () => {
      it('renvoie les rendez-vous triés par date', async () => {
        // Given
        const unRendezVousDtoPourDemain = unRendezVousDto({
          date: demain
        })
        const unRendezVousDtoPourApresDemain = unRendezVousDto({
          date: apresDemain
        })

        await RendezVousSqlModel.bulkCreate([
          unRendezVousDtoPourDemain,
          unRendezVousDtoPourApresDemain
        ])
        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          { idJeune: jeuneDto.id, idRendezVous: unRendezVousDtoPourDemain.id },
          {
            idJeune: jeuneDto.id,
            idRendezVous: unRendezVousDtoPourApresDemain.id
          }
        ])

        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          maintenant: aujourdhuiVendredi
        })

        // Then
        const expected: JeuneHomeSuiviQueryModel = {
          actions: [],
          rendezVous: [
            unRendezVousQueryModel({
              id: unRendezVousDtoPourDemain.id,
              date: unRendezVousDtoPourDemain.date
            }),
            unRendezVousQueryModel({
              id: unRendezVousDtoPourApresDemain.id,
              date: unRendezVousDtoPourApresDemain.date
            })
          ]
        }
        expect(result).to.deep.equal(success(expected))
      })
    })
  })
})

async function createActions(
  dates: string[]
): Promise<Array<AsSql<ActionDto>>> {
  const dtos = dates.map(date => {
    return uneActionDto({
      dateEcheance: new Date(date)
    })
  })
  await ActionSqlModel.bulkCreate(dtos)
  return dtos
}
