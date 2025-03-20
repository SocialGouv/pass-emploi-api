import { SuperviseurSqlRepository } from 'src/infrastructure/repositories/superviseur-sql.repository.db'
import { SuperviseurSqlModel } from 'src/infrastructure/sequelize/models/superviseur.sql-model'
import { Core } from '../../../src/domain/core'
import { expect } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('SuperviseurSqlRepository', () => {
  let superviseurSqlRepository: SuperviseurSqlRepository
  // Given
  const unSuperviseur1 = {
    email: 'test1',
    structure: Core.Structure.MILO
  }
  const unSuperviseur2 = {
    email: 'test2',
    structure: Core.Structure.MILO
  }
  const unSuperviseurUppercase = {
    email: 'TEST@test.test',
    structure: Core.Structure.MILO
  }
  const emailLowercase = 'test@test.test'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    superviseurSqlRepository = new SuperviseurSqlRepository()
  })

  describe('saveSuperviseurs', () => {
    describe('quand on save de nouveaux superviseurs', () => {
      it('les nouveaux superviseurs sont sauvegardés', async () => {
        // When
        const result = await superviseurSqlRepository.saveSuperviseurs([
          unSuperviseur1
        ])

        // Then
        const superviseurSqlModel = await SuperviseurSqlModel.findOne({
          raw: true,
          where: {
            email: unSuperviseur1.email,
            structure: unSuperviseur1.structure
          }
        })

        expect(result._isSuccess).to.equal(true)
        expect(superviseurSqlModel).to.deep.equal(unSuperviseur1)
      })
      it('les nouveaux superviseurs sont sauvegardés avec email en lowercase', async () => {
        // When
        const result = await superviseurSqlRepository.saveSuperviseurs([
          unSuperviseurUppercase
        ])

        // Then
        const superviseurSqlModel = await SuperviseurSqlModel.findOne({
          raw: true,
          where: {
            email: emailLowercase,
            structure: unSuperviseurUppercase.structure
          }
        })

        expect(result._isSuccess).to.equal(true)
        expect(superviseurSqlModel?.email).to.equal(emailLowercase)
      })
    })
    describe('quand on save des superviseurs deja sauvegardés', () => {
      it("les superviseurs sont présents qu'une seule fois", async () => {
        // When
        const result = await superviseurSqlRepository.saveSuperviseurs([
          unSuperviseur1,
          unSuperviseur1
        ])

        // Then
        const superviseursSqlModel = await SuperviseurSqlModel.findAll({
          raw: true,
          where: {
            email: unSuperviseur1.email,
            structure: unSuperviseur1.structure
          }
        })

        expect(result._isSuccess).to.equal(true)
        expect(superviseursSqlModel.length).to.equal(1)
        expect(superviseursSqlModel[0]).to.deep.equal(unSuperviseur1)
      })
    })
  })

  describe('deleteSuperviseurs', () => {
    describe('quand on supprime des superviseurs inexistants', () => {
      it('on ne fait rien', async () => {
        // When
        const result = await superviseurSqlRepository.deleteSuperviseurs([
          unSuperviseur1.email,
          unSuperviseur2.email
        ])

        // Then
        const superviseurs = await SuperviseurSqlModel.findAll({
          raw: true
        })

        expect(superviseurs.length).to.equal(0)
        expect(result._isSuccess).to.equal(true)
      })
    })

    describe('quand on supprime des superviseurs existants', () => {
      it('les superviseurs sont supprimés', async () => {
        // Given
        await superviseurSqlRepository.saveSuperviseurs([
          unSuperviseur1,
          unSuperviseur2
        ])

        // When
        const result = await superviseurSqlRepository.deleteSuperviseurs([
          unSuperviseur1.email,
          unSuperviseur2.email
        ])

        // Then
        const expectedSuperviseur1 = await SuperviseurSqlModel.findOne({
          raw: true,
          where: {
            email: unSuperviseur1.email,
            structure: unSuperviseur1.structure
          }
        })
        const expectedSuperviseur2 = await SuperviseurSqlModel.findOne({
          raw: true,
          where: {
            email: unSuperviseur2.email,
            structure: unSuperviseur2.structure
          }
        })

        expect(result._isSuccess).to.equal(true)
        expect(expectedSuperviseur1).to.equal(null)
        expect(expectedSuperviseur2).to.equal(null)
      })
      it('les superviseurs avec email uppercase sont supprimés', async () => {
        // Given
        await superviseurSqlRepository.saveSuperviseurs([
          unSuperviseurUppercase
        ])

        // When
        const result = await superviseurSqlRepository.deleteSuperviseurs([
          unSuperviseurUppercase.email
        ])

        // Then
        const expectedSuperviseur = await SuperviseurSqlModel.findOne({
          raw: true,
          where: {
            email: emailLowercase,
            structure: unSuperviseurUppercase.structure
          }
        })

        expect(result._isSuccess).to.equal(true)
        expect(expectedSuperviseur).to.equal(null)
      })
    })
  })
})
