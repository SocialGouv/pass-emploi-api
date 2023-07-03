import { expect } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'
import { SessionMiloSqlRepository } from '../../../../src/infrastructure/repositories/milo/session.milo.repository.db'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import { uneDatetime } from '../../../fixtures/date.fixture'

describe('SessionMiloSqlRepository', () => {
  let sessionMiloSqlRepository: SessionMiloSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sessionMiloSqlRepository = new SessionMiloSqlRepository()
  })

  describe('update', () => {
    it('met à jour la structure Milo du conseiller', async () => {
      // Given
      const idStructure = '1'
      const idSession = '1'
      await StructureMiloSqlModel.create({
        id: idStructure,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })

      // When
      await sessionMiloSqlRepository.save({
        id: idSession,
        idStructureMilo: idStructure,
        estVisible: true,
        dateModification: uneDatetime()
      })

      // Then
      const sessionTrouve = await SessionMiloSqlModel.findByPk(idSession)
      expect(sessionTrouve?.idStructureMilo).to.equal('1')
    })
  })
})
