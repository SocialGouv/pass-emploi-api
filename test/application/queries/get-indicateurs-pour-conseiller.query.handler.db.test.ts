import { GetIndicateursPourConseillerQueryHandler } from '../../../src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { expect } from '../../utils'
import { success } from '../../../src/building-blocks/types/result'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'

describe('GetIndicateursPourConseillerQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler
  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'

  before(async () => {
    getIndicateursPourConseillerQueryHandler =
      new GetIndicateursPourConseillerQueryHandler()

    const conseillerDto = unConseillerDto({ id: idConseiller })
    await ConseillerSqlModel.creer(conseillerDto)
    const jeuneDto = unJeuneDto({ id: idJeune, idConseiller })
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it('récupère les actions créées entre une date de début et de fin', async () => {
      // Given
      const dateDebut = new Date('2022-03-01T03:24:00')
      const dateFin = new Date('2022-03-08T03:24:00')
      const dateCreation = new Date('2022-03-05T03:24:00')

      const query = {
        idJeune,
        dateDebut,
        dateFin
      }

      const actionDto = uneActionDto({ dateCreation, idJeune })
      await ActionSqlModel.creer(actionDto)

      // When
      const response = await getIndicateursPourConseillerQueryHandler.handle(
        query
      )

      // Then
      const indicateurAttendu = {
        actions: {
          creees: 1
        }
      }

      expect(response).to.deep.equal(success(indicateurAttendu))
    })
  })
})
