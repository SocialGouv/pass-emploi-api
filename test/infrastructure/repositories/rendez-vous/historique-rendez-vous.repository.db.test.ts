import { unRendezVous } from '../../../fixtures/rendez-vous.fixture'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { Core } from '../../../../src/domain/core'
import { uneDate } from '../../../fixtures/date.fixture'
import { LogModificationRendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/log-modification-rendez-vous-sql.model'
import { expect } from '../../../utils'
import { HistoriqueRendezVousRepositorySql } from '../../../../src/infrastructure/repositories/rendez-vous/historique-rendez-vous.repository.db'
import { getDatabase } from '../../../utils/database-for-testing'
import Structure = Core.Structure

describe('LogModificationRendezVousRepositorySql', () => {
  let historiqueRendezVousRepositorySql: HistoriqueRendezVousRepositorySql

  beforeEach(async () => {
    await getDatabase().cleanPG()
    historiqueRendezVousRepositorySql = new HistoriqueRendezVousRepositorySql()
  })

  describe('save', () => {
    it('crée l‘historique de la modification', async () => {
      //Given
      const conseiller = unConseillerDto({
        structure: Structure.MILO
      })
      await ConseillerSqlModel.creer(conseiller)

      const idRendezVous = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
      const animationCollective = unRendezVous({
        id: idRendezVous
      })
      await RendezVousSqlModel.create(animationCollective)

      const idLogModification = '37b4ca73-fd8b-4194-8d3c-80b6c9949dea'
      const logModification = {
        id: idLogModification,
        idRendezVous,
        date: uneDate(),
        auteur: {
          id: conseiller.id,
          nom: conseiller.nom,
          prenom: conseiller.prenom
        }
      }

      // When
      await historiqueRendezVousRepositorySql.save(logModification)

      // Then
      const logAttendu = await LogModificationRendezVousSqlModel.findByPk(
        idLogModification
      )
      expect(logModification).to.deep.equal(logAttendu?.dataValues)
    })
  })
})
