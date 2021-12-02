import { Authentification } from '../../../src/domain/authentification'
import { AuthentificationSqlRepository } from '../../../src/infrastructure/repositories/authentification-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unUtilisateur } from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { DatabaseForTesting, expect } from '../../utils'
import Type = Authentification.Type

describe('AuthentificationSqlRepository', () => {
  DatabaseForTesting.prepare()
  let authentificationSqlRepository: AuthentificationSqlRepository

  beforeEach(async () => {
    authentificationSqlRepository = new AuthentificationSqlRepository()
  })

  describe('get', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          idAuthentification: 'id-authentification-conseiller',
          structure: Authentification.Structure.MILO
        })
      )
    })
    describe("quand c'est un conseiller", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateur())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'plop',
          Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
  })

  describe('save', () => {
    describe("quand c'est un conseiller", () => {
      it("met à jour l'utilisateur", async () => {
        // When
        await authentificationSqlRepository.save(
          unUtilisateur(),
          'id-authentification-conseiller'
        )

        // Then
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Type.CONSEILLER
        )
        expect(utilisateur).to.deep.equal(unUtilisateur())
      })
    })
  })
})
