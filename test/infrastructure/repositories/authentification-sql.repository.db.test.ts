import { UnauthorizedException } from '@nestjs/common'
import {
  ConseillerInactifError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  Failure,
  isFailure,
  isSuccess,
  Success
} from 'src/building-blocks/types/result'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SuperviseurSqlModel } from 'src/infrastructure/sequelize/models/superviseur.sql-model'
import { uneDate, uneDatetime } from 'test/fixtures/date.fixture'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { AuthentificationSqlOidcRepository } from '../../../src/infrastructure/repositories/authentification-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('AuthentificationSqlRepository', () => {
  let repository: AuthentificationSqlOidcRepository
  let oidcClient: StubbedClass<OidcClient>

  beforeEach(async () => {
    await getDatabase().cleanPG()
    oidcClient = stubClass(OidcClient)
    repository = new AuthentificationSqlOidcRepository(oidcClient)
  })

  describe('getConseiller', () => {
    const conseillerDtoMilo = unConseillerDto({
      idAuthentification: 'id-authentification-conseiller',
      structure: Core.Structure.MILO
    })
    const conseillerDtoPE = unConseillerDto({
      id: 'pe',
      idAuthentification: 'id-authentification-conseiller-pe',
      structure: Core.Structure.POLE_EMPLOI,
      email: 'nils.tavernier@pole-emploi.fr'
    })

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(conseillerDtoMilo)
      await ConseillerSqlModel.creer(conseillerDtoPE)
    })
    describe("quand c'est un conseiller non inscrit dans les superviseurs", () => {
      it("retourne l'utilisateur quand il existe sans roles quand c'est un non MILO", async () => {
        // When
        const utilisateur = await repository.getConseiller(
          conseillerDtoPE.idAuthentification
        )

        // Then
        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            id: conseillerDtoPE.id,
            email: conseillerDtoPE.email!,
            idAuthentification: conseillerDtoPE.idAuthentification,
            structure: Core.Structure.POLE_EMPLOI
          })
        )
      })
      it("retourne l'utilisateur quand il existe avec role SUPERVISEUR quand c'est un MILO", async () => {
        // When
        const utilisateur = await repository.getConseiller(
          conseillerDtoMilo.idAuthentification
        )

        // Then
        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            structure: Core.Structure.MILO,
            roles: [Authentification.Role.SUPERVISEUR]
          })
        )
      })

      it("retourne undefined quand il n'existe pas", async () => {
        // When
        const utilisateur = await repository.getConseiller('id-auth-inconnu')

        // Then
        expect(utilisateur).to.deep.equal(undefined)
      })
    })

    describe("quand c'est un conseiller superviseur dans une seule structure de la même structure de référence", () => {
      it("retourne l'utilisateur avec le role SUPERVISEUR uniquement", async () => {
        // Given
        await SuperviseurSqlModel.create({
          email: conseillerDtoPE.email?.replace(
            /pole-emploi/g,
            'francetravail'
          ),
          structure: conseillerDtoPE.structure
        })
        await SuperviseurSqlModel.create({
          email: conseillerDtoPE.email?.replace(
            /pole-emploi/g,
            'francetravail'
          ),
          structure: Core.Structure.MILO
        })

        // When
        const utilisateur = await repository.getConseiller(
          conseillerDtoPE.idAuthentification
        )

        // Then
        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            id: conseillerDtoPE.id,
            email: conseillerDtoPE.email!,
            idAuthentification: conseillerDtoPE.idAuthentification,
            structure: Core.Structure.POLE_EMPLOI,
            roles: [Authentification.Role.SUPERVISEUR]
          })
        )
      })
    })

    describe("quand c'est un conseiller superviseur dans plusieurs structures de la même structure de référence", () => {
      it("retourne l'utilisateur avec le role SUPERVISEUR et SUPERVISEUR_RESPONSABLE", async () => {
        // Given
        await SuperviseurSqlModel.create({
          email: conseillerDtoPE.email,
          structure: Core.Structure.POLE_EMPLOI
        })
        await SuperviseurSqlModel.create({
          email: conseillerDtoPE.email,
          structure: Core.Structure.POLE_EMPLOI_BRSA
        })

        // When
        const utilisateur = await repository.getConseiller(
          conseillerDtoPE.idAuthentification
        )

        // Then
        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            id: conseillerDtoPE.id,
            email: conseillerDtoPE.email!,
            idAuthentification: conseillerDtoPE.idAuthentification,
            structure: Core.Structure.POLE_EMPLOI,
            roles: [
              Authentification.Role.SUPERVISEUR,
              Authentification.Role.SUPERVISEUR_RESPONSABLE
            ]
          })
        )
      })
    })
  })

  describe('getJeuneByStructure', () => {
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
          structure: Core.Structure.MILO,
          datePremiereConnexion: uneDate()
        })
      )
    })
    it("retourne l'utilisateur quand il existe", async () => {
      // When
      const utilisateur = await repository.getJeuneByStructure(
        'id-authentification-jeune',
        Core.Structure.MILO
      )

      // Then
      expect(utilisateur).to.deep.equal(
        unUtilisateurJeune({ datePremiereConnexion: uneDate() })
      )
    })

    it("retourne undefined quand il n'existe pas", async () => {
      // When
      const utilisateur = await repository.getJeuneByStructure(
        'plop',
        Core.Structure.MILO
      )

      // Then
      expect(utilisateur).to.deep.equal(undefined)
    })
  })

  describe('getJeune', () => {
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
          structure: Core.Structure.MILO,
          datePremiereConnexion: uneDate()
        })
      )
    })
    it("retourne l'utilisateur quand il existe", async () => {
      // When
      const utilisateur = await repository.getJeuneByIdAuthentification(
        'id-authentification-jeune'
      )

      // Then
      expect(utilisateur).to.deep.equal(
        unUtilisateurJeune({ datePremiereConnexion: uneDate() })
      )
    })

    it("retourne undefined quand il n'existe pas", async () => {
      // When
      const utilisateur = await repository.getJeuneByIdAuthentification('plop')

      // Then
      expect(utilisateur).to.deep.equal(undefined)
    })
  })

  describe('getJeuneById', () => {
    const conseillerDto = unConseillerDto({
      idAuthentification: 'id-authentification-conseiller',
      structure: Core.Structure.MILO
    })

    it("retourne l'utilisateur quand il existe", async () => {
      // Given
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idAuthentification: 'id-authentification-jeune',
          structure: Core.Structure.MILO,
          datePremiereConnexion: uneDate()
        })
      )
      // When
      const utilisateur = await repository.getJeuneById('ABCDE')

      // Then
      expect(utilisateur).to.deep.equal(
        unUtilisateurJeune({ datePremiereConnexion: uneDate() })
      )
    })

    it("retourne undefined quand il n'existe pas", async () => {
      // When
      const utilisateur = await repository.getJeuneById('plop')

      // Then
      expect(utilisateur).to.deep.equal(undefined)
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
          structure: Core.Structure.MILO,
          datePremiereConnexion: uneDate()
        })
      )
    })
    describe("quand c'est un jeune connu par son email", () => {
      it("retourne l'utilisateur quand il existe", async () => {
        // When
        const utilisateur = await repository.getJeuneByEmail('john.doe@plop.io')

        // Then
        expect(utilisateur).to.deep.equal(
          unUtilisateurJeune({ datePremiereConnexion: uneDate() })
        )
      })
      it("retourne undefined quand l'email n'existe pas", async () => {
        // When
        const utilisateur = await repository.getJeuneByEmail(
          'email@passemploi.com'
        )

        // Then
        expect(utilisateur).to.be.undefined()
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
        dateDerniereConnexion: uneDate(),
        datePremiereConnexion: uneDate()
      }
      await repository.update(unJeuneMisAJour)

      // Then
      const utilisateur = await repository.getJeuneByStructure(
        'nouvelIdAuthentification',
        Core.Structure.MILO
      )
      expect(utilisateur).to.deep.equal(unJeuneMisAJour)
    })
    it("conserve l'id dossier d'un jeune MILO", async () => {
      const jeuneAvant = await JeuneSqlModel.findByPk(unJeune.id)
      expect(jeuneAvant?.idPartenaire).to.deep.equal(unJeune.idPartenaire)

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
      await repository.update(unJeuneMisAJour)

      // Then
      const jeune = await JeuneSqlModel.findByPk(unJeune.id)
      expect(jeune?.idPartenaire).to.deep.equal(unJeune.idPartenaire)
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
        dateDerniereConnexion: uneDate(),
        datePremiereConnexion: uneDatetime().toJSDate(),
        username: 'milou'
      }
      await repository.update(unConseillerMisAJour)

      // Then
      const utilisateur = await repository.getConseiller(
        'nouvelIdAuthentification'
      )

      const expectedConseillerUtilisateur = {
        ...unConseillerMisAJour,
        roles: [Authentification.Role.SUPERVISEUR]
      }
      expect(utilisateur).to.deep.equal(expectedConseillerUtilisateur)
    })
  })

  describe('save', () => {
    describe("quand c'est un conseiller", () => {
      it("met à jour l'utilisateur", async () => {
        // When
        await repository.save(unUtilisateurConseiller(), uneDate())

        // Then
        const utilisateur = await repository.getConseiller(
          'id-authentification-conseiller'
        )

        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            roles: [Authentification.Role.SUPERVISEUR],
            datePremiereConnexion: uneDate()
          })
        )
      })
    })
    describe("quand c'est un conseiller deja existant", () => {
      it("met à jour l'utilisateur sans mettre à jour la date de création", async () => {
        // Given
        const utilisateurConseiller = unUtilisateurConseiller()
        const nouvelEmail = 'test@test.com'
        const dateCreation = uneDatetime().toJSDate()

        // When
        await repository.save(utilisateurConseiller, dateCreation)
        await repository.save({
          ...utilisateurConseiller,
          email: nouvelEmail
        })

        // Then
        const utilisateur = await repository.getConseiller(
          'id-authentification-conseiller'
        )

        const conseiller = utilisateur
          ? await ConseillerSqlModel.findOne({ where: { id: utilisateur.id } })
          : undefined

        expect(utilisateur).to.deep.equal(
          unUtilisateurConseiller({
            email: nouvelEmail,
            roles: [Authentification.Role.SUPERVISEUR]
          })
        )

        expect(conseiller?.dateCreation).to.deep.equal(dateCreation)
      })
    })
  })

  describe('updateJeune', () => {
    let jeune
    let jeuneTrouve: JeuneSqlModel | null
    beforeEach(async () => {
      // Given
      const conseiller = unConseillerDto()
      jeune = unJeuneDto({ idConseiller: conseiller.id })
      await ConseillerSqlModel.create(conseiller)
      await JeuneSqlModel.create(jeune)

      // When
      await repository.updateJeune({
        id: jeune.id,
        idAuthentification: 'un-nouveau-id'
      })
      jeuneTrouve = await JeuneSqlModel.findByPk(jeune.id)
    })
    it("met à jour l'id jeune", async () => {
      // Then
      expect(jeuneTrouve?.idAuthentification).to.equal('un-nouveau-id')
    })
  })

  describe('recupererAccesPartenaire', () => {
    it('récupère le token pour appeler l’API partenaire', async () => {
      // Given
      oidcClient.exchangeToken.resolves('accesPartenaire')

      // When
      const accesPartenaire = await repository.recupererAccesPartenaire(
        'bearer',
        Core.Structure.MILO
      )

      // Then
      expect(oidcClient.exchangeToken).to.have.been.calledOnceWithExactly(
        'bearer',
        Core.Structure.MILO
      )
      expect(accesPartenaire).to.equal('accesPartenaire')
    })
  })

  describe('seFairePasserPourUnConseiller', () => {
    it('récupère le token du conseiller pour appeler l’API partenaire', async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: 'id-conseiller',
          idAuthentification: 'id-authentification-conseiller'
        })
      )
      oidcClient.exchangeToken.resolves('accesPartenaireConseiller')

      // When
      const resultAccesPartenaireConseiller =
        await repository.seFairePasserPourUnConseiller(
          'id-conseiller',
          'bearer',
          Core.Structure.MILO
        )

      // Then
      expect(oidcClient.exchangeToken).to.have.been.calledOnceWithExactly(
        'bearer',
        Core.Structure.MILO,
        { sub: 'id-authentification-conseiller', type: 'CONSEILLER' }
      )
      expect(isSuccess(resultAccesPartenaireConseiller)).to.equal(true)
      expect(
        (resultAccesPartenaireConseiller as Success<string>).data
      ).to.equal('accesPartenaireConseiller')
    })

    it('échoue si le conseiller n’existe pas', async () => {
      // When
      const resultAccesPartenaireConseiller =
        await repository.seFairePasserPourUnConseiller(
          'id-conseiller',
          'bearer',
          Core.Structure.MILO
        )

      // Then
      expect(oidcClient.exchangeToken).not.to.have.been.called()
      expect(isFailure(resultAccesPartenaireConseiller)).to.equal(true)
      expect(
        (resultAccesPartenaireConseiller as Failure).error
      ).to.be.an.instanceOf(NonTrouveError)
    })

    it('échoue si le conseiller est inactif depuis trop longtemps', async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: 'id-conseiller',
          idAuthentification: 'id-authentification-conseiller'
        })
      )
      oidcClient.exchangeToken.throws(new UnauthorizedException())

      // When
      const resultAccesPartenaireConseiller =
        await repository.seFairePasserPourUnConseiller(
          'id-conseiller',
          'bearer',
          Core.Structure.MILO
        )

      // Then
      expect(isFailure(resultAccesPartenaireConseiller)).to.equal(true)
      expect(
        (resultAccesPartenaireConseiller as Failure).error
      ).to.be.an.instanceOf(ConseillerInactifError)
    })
  })
})
