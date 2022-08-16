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
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'

describe('GetJeuneHomeSuiviQueryHandler', () => {
  DatabaseForTesting.prepare()
  let handler: GetJeuneHomeSuiviQueryHandler
  const aujourdhuiVendredi = new Date('2022-08-12T12:00:00Z')
  const demain = new Date('2022-08-13T12:00:00Z')
  const apresDemain = new Date('2022-08-14T12:00:00Z')
  const jeuneDto = unJeuneDto()

  beforeEach(async () => {
    handler = new GetJeuneHomeSuiviQueryHandler()
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it('doit retourner les événements bornés entre samedi dernier minuit et samedi en huit minuit', async () => {
      const vendrediDernier = new Date('2022-08-12T12:00:00Z')
      const samediDernier = new Date('2022-08-13T12:00:00Z')
      const aujourdhuiLundi = new Date('2022-08-15T12:00:00Z')
      const vendrediEnHuit = new Date('2022-08-26T23:00:00Z')
      const samediEnHuit = new Date('2022-08-27T00:00:00Z')

      const uneActionDtoVendrediDernier = uneActionDto({
        dateEcheance: vendrediDernier
      })
      const uneActionDtoSamediDernier = uneActionDto({
        dateEcheance: samediDernier
      })
      const uneActionDtoPourVendrediEnHuit = uneActionDto({
        dateEcheance: vendrediEnHuit
      })
      const uneActionDtoPourSamediEnHuit = uneActionDto({
        dateEcheance: samediEnHuit
      })

      await ActionSqlModel.bulkCreate([
        uneActionDtoVendrediDernier,
        uneActionDtoSamediDernier,
        uneActionDtoPourVendrediEnHuit,
        uneActionDtoPourSamediEnHuit
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
            id: uneActionDtoSamediDernier.id,
            dateEcheance: samediDernier.toISOString()
          }),
          uneActionQueryModelSansJeune({
            id: uneActionDtoPourVendrediEnHuit.id,
            dateEcheance: vendrediEnHuit.toISOString()
          })
        ],
        rendezVous: []
      }
      expect(result).to.deep.equal(success(expected))
    })

    describe('actions', () => {
      const uneActionDtoPourDemain = uneActionDto({
        dateEcheance: demain
      })
      const uneActionDtoPourApresDemain = uneActionDto({
        dateEcheance: apresDemain
      })

      beforeEach(async () => {
        // Given
        await ActionSqlModel.creer(uneActionDtoPourApresDemain)
        await ActionSqlModel.creer(uneActionDtoPourDemain)
      })
      it('doit retourner la liste des actions triées chronologiquement', async () => {
        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          maintenant: aujourdhuiVendredi
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
