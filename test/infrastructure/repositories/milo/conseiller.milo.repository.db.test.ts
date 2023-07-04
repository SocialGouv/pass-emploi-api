import {
  ConseillerMiloSansStructure,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ConseillerMiloSqlRepository } from '../../../../src/infrastructure/repositories/milo/conseiller.milo.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { expect } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('ConseillerMiloSqlRepository', () => {
  let conseillerMiloSqlRepository: ConseillerMiloSqlRepository
  const idConseiller = '1'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    conseillerMiloSqlRepository = new ConseillerMiloSqlRepository()
  })

  describe('get', () => {
    it("retourne undefined quand le conseiller n'existe pas", async () => {
      // When
      const conseiller = await conseillerMiloSqlRepository.get(idConseiller)

      // Then
      expect(conseiller).to.deep.equal(
        failure(new NonTrouveError('Conseiller Milo', idConseiller))
      )
    })
    it('retourne undefined quand le conseiller existe mais sans structure Milo', async () => {
      // Given
      await ConseillerSqlModel.create(unConseillerDto({ id: idConseiller }))

      // When
      const conseiller = await conseillerMiloSqlRepository.get(idConseiller)

      // Then
      expect(conseiller).to.deep.equal(
        failure(new ConseillerMiloSansStructure(idConseiller))
      )
    })
    it('retourne le conseiller existant avec structure Milo', async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure'
      })
      await ConseillerSqlModel.create(
        unConseillerDto({ id: idConseiller, idStructureMilo })
      )

      // When
      const conseiller = await conseillerMiloSqlRepository.get(idConseiller)

      // Then
      expect(conseiller).to.deep.equal(
        success({
          id: idConseiller,
          idStructure: idStructureMilo
        })
      )
    })
  })

  describe('update', () => {
    it('met à jour la structure Milo du conseiller', async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure'
      })
      await ConseillerSqlModel.create(unConseillerDto({ id: idConseiller }))

      // When
      await conseillerMiloSqlRepository.save({
        id: idConseiller,
        idStructure: idStructureMilo
      })

      // Then
      const conseillerTrouve = await ConseillerSqlModel.findByPk(idConseiller)
      expect(conseillerTrouve?.idStructureMilo).to.equal(idStructureMilo)
    })
  })
})
