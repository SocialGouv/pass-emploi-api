import {
  GetIndicateursPourConseillerQueryHandler,
  IndicateursPourConseillerQueryModel
} from '../../../src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { expect } from '../../utils'
import { success } from '../../../src/building-blocks/types/result'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { Action } from '../../../src/domain/action/action'
import Statut = Action.Statut

describe('GetIndicateursPourConseillerQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler
  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'

  before(async () => {
    getIndicateursPourConseillerQueryHandler =
      new GetIndicateursPourConseillerQueryHandler()
  })

  describe('handle', () => {
    beforeEach(async () => {
      const conseillerDto = unConseillerDto({ id: idConseiller })
      await ConseillerSqlModel.creer(conseillerDto)
      const jeuneDto = unJeuneDto({ id: idJeune, idConseiller })
      await JeuneSqlModel.creer(jeuneDto)
    })

    const dateDebut = new Date('2022-03-01T03:24:00')
    const dateFin = new Date('2022-03-08T03:24:00')

    it('récupère les actions créées entre une date de début et de fin', async () => {
      // Given
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
      const indicateurAttendu: IndicateursPourConseillerQueryModel = {
        actions: {
          creees: 1,
          terminees: 0
        }
      }

      expect(response).to.deep.equal(success(indicateurAttendu))
    })

    it('récupère les actions en retard entre une date de début et de fin', async () => {
      // Given
      const dateCreation = new Date('2022-02-05T03:24:00')
      const dateEcheance = new Date('2022-03-05T03:24:00')

      const query = {
        idJeune,
        dateDebut,
        dateFin
      }

      const actionDto = uneActionDto({
        dateCreation,
        idJeune,
        dateEcheance,
        statut: Statut.PAS_COMMENCEE
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const response = await getIndicateursPourConseillerQueryHandler.handle(
        query
      )

      // Then
      const indicateurAttendu: IndicateursPourConseillerQueryModel = {
        actions: {
          creees: 0,
          terminees: 1
        }
      }

      expect(response).to.deep.equal(success(indicateurAttendu))
    })
  })
})
