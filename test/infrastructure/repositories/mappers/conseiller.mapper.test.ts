import { fromSqlToDetailConseillerQueryModel } from '../../../../src/infrastructure/repositories/mappers/conseillers.mappers'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { DatabaseForTesting, expect } from '../../../utils'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import {
  AgenceDto,
  AgenceSqlModel
} from '../../../../src/infrastructure/sequelize/models/agence.sql-model'
import { Core } from '../../../../src/domain/core'
import Structure = Core.Structure

describe('fromSqlToDetailConseillerQueryModel', () => {
  before(() => {
    DatabaseForTesting.prepare()
  })

  describe('sans agence', () => {
    it('renvoie le query model', async () => {
      // Given
      const sql = await ConseillerSqlModel.create(unConseillerDto())

      // When
      const result = fromSqlToDetailConseillerQueryModel(sql)

      // Then
      expect(result).to.deep.equal({
        id: '1',
        firstName: 'Nils',
        lastName: 'Tavernier',
        email: 'nils.tavernier@passemploi.com',
        agence: undefined
      })
    })
  })

  describe('avec agence non présente dans le référentiel', () => {
    it('renvoie le query model', async () => {
      // Given
      const sql = await ConseillerSqlModel.create(
        unConseillerDto({
          nomManuelAgence: "nom d'agence"
        })
      )

      // When
      const result = fromSqlToDetailConseillerQueryModel(sql)

      // Then
      expect(result).to.deep.equal({
        id: '1',
        firstName: 'Nils',
        lastName: 'Tavernier',
        email: 'nils.tavernier@passemploi.com',
        agence: {
          id: undefined,
          nom: "nom d'agence"
        }
      })
    })
  })

  describe('avec agence présente dans le référentiel', () => {
    it('renvoie le query model', async () => {
      // Given
      const uneAgence: Partial<AgenceDto> = {
        id: "id d'agence",
        nomAgence: 'Bonjour je suis une agence',
        structure: Structure.MILO,
        codeDepartement: '45',
        nomRegion: 'yolo'
      }
      await AgenceSqlModel.create(uneAgence)
      await ConseillerSqlModel.create(
        unConseillerDto({
          idAgence: "id d'agence"
        })
      )

      const sql = await ConseillerSqlModel.findByPk('1', {
        include: [AgenceSqlModel]
      })

      // When
      const result = fromSqlToDetailConseillerQueryModel(sql!)

      // Then
      expect(result).to.deep.equal({
        id: '1',
        firstName: 'Nils',
        lastName: 'Tavernier',
        email: 'nils.tavernier@passemploi.com',
        agence: {
          id: "id d'agence",
          nom: 'Bonjour je suis une agence'
        }
      })
    })
  })
})
