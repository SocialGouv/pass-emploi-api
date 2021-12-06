import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { Authentification } from '../../../src/domain/authentification'
import { AuthentificationSqlRepository } from '../../../src/infrastructure/repositories/authentification-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  unUtilisateurJeune,
  unUtilisateurConseiller
} from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { DatabaseForTesting, expect } from '../../utils'
import Structure = Authentification.Structure
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
      await JeuneSqlModel.creer(
        unJeuneDto({
          idAuthentification: 'id-authentification-jeune',
          structure: Authentification.Structure.MILO
        })
      )
    })
    describe("quand c'est un conseiller", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Structure.MILO,
          Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateurConseiller())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'plop',
          Structure.MILO,
          Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
    describe("quand c'est un jeune", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-jeune',
          Structure.MILO,
          Type.JEUNE
        )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateurJeune())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'plop',
          Structure.MILO,
          Type.JEUNE
        )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
  })

  describe('getJeuneMiloByEmail', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          idAuthentification: 'id-authentification-conseiller',
          structure: Authentification.Structure.MILO
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          idAuthentification: 'id-authentification-jeune',
          email: 'john.doe@passemploi.com',
          structure: Authentification.Structure.MILO
        })
      )
    })
    describe("quand c'est un jeune connu par son email", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur =
          await authentificationSqlRepository.getJeuneMiloByEmail(
            'john.doe@passemploi.com'
          )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateurJeune())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur =
          await authentificationSqlRepository.getJeuneMiloByEmail(
            'email@passemploi.com'
          )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
  })

  describe('updateJeuneMilo', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          idAuthentification: 'id-authentification-conseiller',
          structure: Authentification.Structure.MILO
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune',
          email: 'john.doe@passemploi.com',
          structure: Authentification.Structure.MILO
        })
      )
    })
    it("met à jour l'utilisateur", async () => {
      // When
      await authentificationSqlRepository.updateJeuneMilo(
        'id-jeune',
        'id-authentification-jeune'
      )

      // Then
      const utilisateur = await authentificationSqlRepository.get(
        'id-authentification-jeune',
        Structure.MILO,
        Type.JEUNE
      )
      expect(utilisateur).to.deep.equal(
        unUtilisateurJeune({
          id: 'id-jeune'
        })
      )
    })
  })

  describe('save', () => {
    describe("quand c'est un conseiller", () => {
      it("met à jour l'utilisateur", async () => {
        // When
        await authentificationSqlRepository.save(
          unUtilisateurConseiller(),
          'id-authentification-conseiller'
        )

        // Then
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Structure.MILO,
          Type.CONSEILLER
        )
        expect(utilisateur).to.deep.equal(unUtilisateurConseiller())
      })
    })
  })
})
