import { expect } from '../../utils'
import { AgenceSqlRepository } from '../../../src/infrastructure/repositories/agence-sql.repository.db'
import {
  AgenceDto,
  AgenceSqlModel
} from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { Core } from '../../../src/domain/core'
import { getDatabase } from '../../utils/database-for-testing'
import Structure = Core.Structure

describe('AgenceSqlRepository', () => {
  let agenceSqlRepository: AgenceSqlRepository
  const agenceMilo: Partial<AgenceDto> = {
    id: 'Bonjour je suis un id milo',
    nomAgence: 'Bonjour je suis une agence',
    structure: Structure.MILO,
    codeDepartement: '45',
    nomRegion: 'yolo'
  }
  const agencePE: Partial<AgenceDto> = {
    id: 'Bonjour je suis un id pe',
    nomAgence: 'Bonjour je suis une agence',
    structure: Structure.POLE_EMPLOI,
    codeDepartement: '45',
    nomRegion: 'yolo'
  }

  beforeEach(async () => {
    await getDatabase().cleanPG()
    agenceSqlRepository = new AgenceSqlRepository()
    await AgenceSqlModel.create(agenceMilo)
    await AgenceSqlModel.create(agencePE)
  })

  describe('Quand la base contient des agences', () => {
    it("get retourne l'agence correspondante", async () => {
      // When
      const result = await agenceSqlRepository.get(
        'Bonjour je suis un id pe',
        Structure.POLE_EMPLOI
      )

      // Then
      expect(result).to.deep.equal({
        id: 'Bonjour je suis un id pe',
        nom: 'Bonjour je suis une agence'
      })
    })
  })
})
