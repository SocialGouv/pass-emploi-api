import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SuperviseurSqlModel } from 'src/infrastructure/sequelize/models/superviseur.sql-model'
import { uneDate, uneDatetime } from 'test/fixtures/date.fixture'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { AuthentificationSqlRepository } from '../../../src/infrastructure/repositories/authentification-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('AuthentificationSqlRepository', () => {
  DatabaseForTesting.prepare()
  let authentificationSqlRepository: AuthentificationSqlRepository

  beforeEach(async () => {
    authentificationSqlRepository = new AuthentificationSqlRepository()
  })

  describe('get', () => {
    const conseillerDto = unConseillerDto({
      idAuthentification: 'id-authentification-conseiller',
      structure: Core.Structure.MILO
    })

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          idAuthentification: 'id-authentification-jeune',
          structure: Core.Structure.MILO
        })
      )
    })
    describe("quand c'est un conseiller", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Core.Structure.MILO,
          Authentification.Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateurConseiller())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'plop',
          Core.Structure.MILO,
          Authentification.Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
    describe("quand c'est un conseiller superviseur", () => {
      it("retourne l'utilisateur avec le bon role", async () => {
        // Given
        await SuperviseurSqlModel.create({
          email: conseillerDto.email,
          structure: conseillerDto.structure
        })

        // When
        const utilisateur = await authentificationSqlRepository.get(
          conseillerDto.idAuthentification,
          conseillerDto.structure,
          Authentification.Type.CONSEILLER
        )

        // Then
        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            roles: [Authentification.Role.SUPERVISEUR]
          })
        )
      })
    })
    describe("quand c'est un jeune", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-jeune',
          Core.Structure.MILO,
          Authentification.Type.JEUNE
        )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateurJeune())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.get(
          'plop',
          Core.Structure.MILO,
          Authentification.Type.JEUNE
        )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
  })

  describe('getJeuneByEmail', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          idAuthentification: 'id-authentification-conseiller',
          structure: Core.Structure.MILO
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          idAuthentification: 'id-authentification-jeune',
          email: 'john.doe@plop.io',
          structure: Core.Structure.MILO
        })
      )
    })
    describe("quand c'est un jeune connu par son email", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.getJeuneByEmail(
          'john.doe@plop.io'
        )

        // Then
        expect(utilisateur).to.deep.equal(unUtilisateurJeune())
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await authentificationSqlRepository.getJeuneByEmail(
          'email@passemploi.com'
        )

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })
  })

  describe('update', () => {
    const unConseiller = unConseillerDto({
      idAuthentification: 'id-authentification-conseiller',
      structure: Core.Structure.MILO
    })
    const unJeune = unJeuneDto({
      id: 'id-jeune',
      email: 'john.doe@plop.io',
      structure: Core.Structure.MILO
    })

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseiller)
      await JeuneSqlModel.creer(unJeune)
    })
    it("met à jour l'utilisateur de type JEUNE", async () => {
      // When
      const unJeuneMisAJour: Authentification.Utilisateur = {
        id: unJeune.id,
        type: Authentification.Type.JEUNE,
        structure: Core.Structure.MILO,
        roles: [],
        nom: 'nouveauNom',
        prenom: 'nouveauPrenom',
        email: 'nouveauEmail',
        idAuthentification: 'nouvelIdAuthentification',
        dateDerniereConnexion: uneDate()
      }
      await authentificationSqlRepository.update(unJeuneMisAJour)

      // Then
      const utilisateur = await authentificationSqlRepository.get(
        'nouvelIdAuthentification',
        Core.Structure.MILO,
        Authentification.Type.JEUNE
      )
      expect(utilisateur).to.deep.equal(unJeuneMisAJour)
    })
    it("met à jour l'utilisateur de type CONSEILLER", async () => {
      // When
      const unConseillerMisAJour: Authentification.Utilisateur = {
        id: unConseiller.id,
        type: Authentification.Type.CONSEILLER,
        structure: Core.Structure.MILO,
        roles: [],
        nom: 'nouveauNom',
        prenom: 'nouveauPrenom',
        email: 'nouveauEmail',
        idAuthentification: 'nouvelIdAuthentification',
        dateDerniereConnexion: uneDate()
      }
      await authentificationSqlRepository.update(unConseillerMisAJour)

      // Then
      const utilisateur = await authentificationSqlRepository.get(
        'nouvelIdAuthentification',
        Core.Structure.MILO,
        Authentification.Type.CONSEILLER
      )
      expect(utilisateur).to.deep.equal(unConseillerMisAJour)
    })
  })
  describe('updateJeunePremiereConnexion', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          idAuthentification: 'id-authentification-conseiller',
          structure: Core.Structure.MILO
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune',
          email: 'john.doe@plop.io',
          structure: Core.Structure.MILO
        })
      )
    })
    it("met à jour l'utilisateur", async () => {
      // When
      await authentificationSqlRepository.updateJeunePremiereConnexion(
        'id-jeune',
        'nouveauNom',
        'nouveauPrenom',
        'id-authentification-jeune',
        uneDate()
      )

      // Then
      const jeuneSql = await JeuneSqlModel.findOne({
        where: { id: 'id-jeune' }
      })
      expect(jeuneSql).not.to.be.equal(null)
      expect(jeuneSql!.id).to.be.equal('id-jeune')
      expect(jeuneSql!.nom).to.be.equal('nouveauNom')
      expect(jeuneSql!.prenom).to.be.equal('nouveauPrenom')
      expect(jeuneSql!.idAuthentification).to.be.equal(
        'id-authentification-jeune'
      )
      expect(jeuneSql!.datePremiereConnexion).to.be.deep.equal(uneDate())
      expect(jeuneSql!.dateDerniereConnexion).to.be.deep.equal(uneDate())
    })
  })

  describe('save', () => {
    describe("quand c'est un conseiller", () => {
      it("met à jour l'utilisateur", async () => {
        // When
        await authentificationSqlRepository.save(unUtilisateurConseiller())

        // Then
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Core.Structure.MILO,
          Authentification.Type.CONSEILLER
        )
        expect(utilisateur).to.deep.equal(unUtilisateurConseiller())
      })
    })
    describe("quand c'est un conseiller deja existant", () => {
      it("met à jour l'utilisateur sans mettre à jour la date de création", async () => {
        // Given
        const utilisateurConseiller = unUtilisateurConseiller()
        const nouvelEmail = 'test@test.com'
        const dateCreation = uneDatetime.toJSDate()

        // When
        await authentificationSqlRepository.save(
          utilisateurConseiller,
          dateCreation
        )
        await authentificationSqlRepository.save({
          ...utilisateurConseiller,
          email: nouvelEmail
        })

        // Then
        const utilisateur = await authentificationSqlRepository.get(
          'id-authentification-conseiller',
          Core.Structure.MILO,
          Authentification.Type.CONSEILLER
        )

        const conseiller = utilisateur
          ? await ConseillerSqlModel.findOne({ where: { id: utilisateur.id } })
          : undefined

        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({ email: nouvelEmail })
        )

        expect(conseiller?.dateCreation).to.deep.equal(dateCreation)
      })
    })
  })
})
