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
  const hier = new Date('2022-08-14T12:00:00Z')
  const aujourdhui = new Date('2022-08-15T12:00:00Z')
  const demain = new Date('2022-08-16T12:00:00Z')
  const apresDemain = new Date('2022-08-17T12:00:00Z')
  const jeuneDto = unJeuneDto()

  beforeEach(async () => {
    handler = new GetJeuneHomeSuiviQueryHandler()
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)
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
          ],
          rendezVous: []
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
          ],
          rendezVous: []
        }
        expect(result).to.deep.equal(success(expected))
      })
    })
    describe('rendez-vous', () => {
      it('renvoie les rendez-vous triés par date', async () => {
        // Given
        const unRendezVousDtoQuiDateDHier = unRendezVousDto({
          date: hier
        })
        const unRendezVousDtoPourDemain = unRendezVousDto({
          date: demain
        })
        const unRendezVousDtoPourApresDemain = unRendezVousDto({
          date: apresDemain
        })

        await RendezVousSqlModel.bulkCreate([
          unRendezVousDtoQuiDateDHier,
          unRendezVousDtoPourDemain,
          unRendezVousDtoPourApresDemain
        ])
        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          {
            idJeune: jeuneDto.id,
            idRendezVous: unRendezVousDtoQuiDateDHier.id
          },
          { idJeune: jeuneDto.id, idRendezVous: unRendezVousDtoPourDemain.id },
          {
            idJeune: jeuneDto.id,
            idRendezVous: unRendezVousDtoPourApresDemain.id
          }
        ])

        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          dateDebut: aujourdhui,
          dateFin: apresDemain
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
