import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import {
  GetFavorisJeuneQuery,
  GetFavorisJeuneQueryHandler
} from '../../../../src/application/queries/favoris/get-favoris-jeune.query.handler.db'
import { FavorisQueryModel } from '../../../../src/application/queries/query-models/favoris.query-model'
import { Core } from '../../../../src/domain/core'
import { Offre } from '../../../../src/domain/offre/offre'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from '../../../fixtures/sql-models/favoris.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

const now = uneDatetime()

describe('GetFavorisJeuneQueryHandler', () => {
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getFavorisJeuneQueryHandler: GetFavorisJeuneQueryHandler

  const idJeune = 'id-jeune'
  const idConseiller = 'id-conseiller'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getFavorisJeuneQueryHandler = new GetFavorisJeuneQueryHandler(
      jeuneAuthorizer,
      conseillerAgenceAuthorizer
    )
  })

  describe('handle', () => {
    let jeuneDto: AsSql<JeuneDto>

    beforeEach(async () => {
      const conseillerDto = unConseillerDto({ id: idConseiller })
      await ConseillerSqlModel.creer(conseillerDto)
      jeuneDto = unJeuneDto({
        id: idJeune,
        idConseiller
      })
      await JeuneSqlModel.creer(jeuneDto)
    })

    it("retourne une liste vide quand le jeune n'a aucun favori", async () => {
      // Given
      const query = { idJeune: jeuneDto.id }

      // When
      const listeFavorisObtenue = await getFavorisJeuneQueryHandler.handle(
        query
      )

      // Then
      expect(listeFavorisObtenue).to.deep.equal([])
    })

    it('retourne une liste de deux favoris, une offre emploi et une offre alternance, triés par date decroissante', async () => {
      // Given
      const idOffreEmploiDb = 1
      const idOffreAlternanceDb = 2
      const favoriOffreEmploiDb = unFavoriOffreEmploi({
        id: idOffreEmploiDb,
        idOffre: 'id-offre-1',
        titre: 'titre-1',
        nomEntreprise: 'entreprise',
        idJeune,
        dateCreation: now.toJSDate(),
        dateCandidature: now.toJSDate()
      })
      const favoriOffreAlternanceDb = unFavoriOffreEmploi({
        id: idOffreAlternanceDb,
        idOffre: 'id-offre-2',
        titre: 'titre-2',
        nomEntreprise: 'entreprise',
        isAlternance: true,
        idJeune,
        dateCreation: now.plus({ minutes: 1 }).toJSDate()
      })
      await FavoriOffreEmploiSqlModel.create(favoriOffreEmploiDb)
      await FavoriOffreEmploiSqlModel.create(favoriOffreAlternanceDb)

      const favoriOffreEmploi: FavorisQueryModel = {
        idOffre: 'id-offre-1',
        titre: 'titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans'],
        dateCreation: now.toISO(),
        dateCandidature: now.toISO(),
        origine: undefined
      }
      const favoriOffreAlternance: FavorisQueryModel = {
        idOffre: 'id-offre-2',
        titre: 'titre-2',
        type: Offre.Favori.Type.ALTERNANCE,
        organisation: 'entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans'],
        dateCreation: now.plus({ minutes: 1 }).toISO(),
        dateCandidature: undefined,
        origine: undefined
      }
      const listeAttendue = [favoriOffreAlternance, favoriOffreEmploi]

      // When
      const query = { idJeune: jeuneDto.id }
      const listeFavorisObtenue = await getFavorisJeuneQueryHandler.handle(
        query
      )

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })

    it('retourne une liste de deux favoris offre immersion du jeune avec tri date', async () => {
      // Given
      const favoriOffreImmersionDb1 = unFavoriOffreImmersion({
        id: 1,
        idOffre: 'id-offre-1',
        metier: 'titre-4',
        nomEtablissement: 'etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: now.toJSDate(),
        dateCandidature: now.toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb1)
      const favoriOffreImmersionDb2 = unFavoriOffreImmersion({
        id: 2,
        idOffre: 'id-offre-2',
        metier: 'titre-3',
        nomEtablissement: 'etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: now.plus({ days: 1 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb2)

      const favoriOffreImmersion1: FavorisQueryModel = {
        idOffre: 'id-offre-1',
        titre: 'titre-4',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.toISO(),
        dateCandidature: now.toISO()
      }
      const favoriOffreImmersion2: FavorisQueryModel = {
        idOffre: 'id-offre-2',
        titre: 'titre-3',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 1 }).toISO(),
        dateCandidature: undefined
      }

      const idOffreEmploiDb = 1
      const idOffreAlternanceDb = 2

      const favoriOffreEmploiDb = unFavoriOffreEmploi({
        id: idOffreEmploiDb,
        idOffre: 'id-offre-1',
        titre: 'titre-1',
        nomEntreprise: 'entreprise',
        idJeune,
        dateCreation: now.plus({ days: 2 }).toJSDate()
      })
      const favoriOffreAlternanceDb = unFavoriOffreEmploi({
        id: idOffreAlternanceDb,
        idOffre: 'id-offre-2',
        titre: 'titre-2',
        nomEntreprise: 'entreprise',
        isAlternance: true,
        idJeune,
        dateCreation: now.plus({ days: 3 }).toJSDate()
      })
      await FavoriOffreEmploiSqlModel.create(favoriOffreEmploiDb)
      await FavoriOffreEmploiSqlModel.create(favoriOffreAlternanceDb)

      const favoriOffreEmploi: FavorisQueryModel = {
        idOffre: 'id-offre-1',
        titre: 'titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans'],
        dateCreation: now.plus({ days: 2 }).toISO(),
        dateCandidature: undefined,
        origine: undefined
      }
      const favoriOffreAlternance: FavorisQueryModel = {
        idOffre: 'id-offre-2',
        titre: 'titre-2',
        type: Offre.Favori.Type.ALTERNANCE,
        organisation: 'entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans'],
        dateCreation: now.plus({ days: 3 }).toISO(),
        dateCandidature: undefined,
        origine: undefined
      }

      const listeAttendue = [
        favoriOffreAlternance,
        favoriOffreEmploi,
        favoriOffreImmersion2,
        favoriOffreImmersion1
      ]

      const query = { idJeune: jeuneDto.id }

      // When
      const listeFavorisObtenue = await getFavorisJeuneQueryHandler.handle(
        query
      )

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })

    it('retourne une liste de deux favoris offre immersion du jeune', async () => {
      // Given
      const favoriOffreImmersionDb1 = unFavoriOffreImmersion({
        id: 1,
        idOffre: 'id-offre-1',
        metier: 'metier-first-dans-la-liste-triee',
        nomEtablissement: 'etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().plus({ days: 1 }).toJSDate(),
        dateCandidature: uneDatetime().plus({ days: 2 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb1)
      const favoriOffreImmersionDb2 = unFavoriOffreImmersion({
        id: 2,
        idOffre: 'id-offre-2',
        metier: 'metier-2e-dans-la-liste-triee',
        nomEtablissement: 'etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().plus({ days: 2 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb2)
      const favoriOffreImmersionDb3 = unFavoriOffreImmersion({
        id: 3,
        idOffre: 'id-offre-3',
        metier: 'metier-1er-dans-la-liste-triee',
        nomEtablissement: 'etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().plus({ days: 3 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb3)
      const favoriOffreImmersionDb0 = unFavoriOffreImmersion({
        id: 0,
        idOffre: 'id-offre-0',
        metier: 'metier-0e-dans-la-liste-triee',
        nomEtablissement: 'etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb0)

      const favoriOffreImmersion1: FavorisQueryModel = {
        idOffre: 'id-offre-1',
        titre: 'metier-first-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 1 }).toISO(),
        dateCandidature: now.plus({ days: 2 }).toISO()
      }
      const favoriOffreImmersion0: FavorisQueryModel = {
        idOffre: 'id-offre-0',
        titre: 'metier-0e-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.toISO(),
        dateCandidature: undefined
      }
      const favoriOffreImmersion2: FavorisQueryModel = {
        idOffre: 'id-offre-2',
        titre: 'metier-2e-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 2 }).toISO(),
        dateCandidature: undefined
      }
      const favoriOffreImmersion3: FavorisQueryModel = {
        idOffre: 'id-offre-3',
        titre: 'metier-1er-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 3 }).toISO(),
        dateCandidature: undefined
      }
      const listeAttendue = [
        favoriOffreImmersion3,
        favoriOffreImmersion2,
        favoriOffreImmersion1,
        favoriOffreImmersion0
      ]

      const query = { idJeune: jeuneDto.id }

      // When
      const listeFavorisObtenue = await getFavorisJeuneQueryHandler.handle(
        query
      )

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })

    it("retourne une liste d'un favori offre service civique du jeune", async () => {
      // Given
      const favoriOffreServiceCiviqueDb = unFavoriOffreEngagement({
        idOffre: 'id-offre',
        titre: 'titre',
        idJeune,
        dateCreation: now.toJSDate()
      })
      await FavoriOffreEngagementSqlModel.create(favoriOffreServiceCiviqueDb)

      const favoriOffreServiceCivique: FavorisQueryModel = {
        idOffre: 'id-offre',
        titre: 'titre',
        type: Offre.Favori.Type.SERVICE_CIVIQUE,
        organisation: undefined,
        localisation: undefined,
        tags: ['infra'],
        dateCreation: now.toISO(),
        dateCandidature: undefined
      }
      const listeAttendue = [favoriOffreServiceCivique]

      const query = { idJeune: jeuneDto.id }

      // When
      const listeFavorisObtenue = await getFavorisJeuneQueryHandler.handle(
        query
      )

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })

    it('retourne les favoris dernièrement modifiés pendant la période demandée', async () => {
      // Given
      const debut = now.minus({ day: 3 })
      const fin = now.plus({ day: 4 })

      const favoriCreePendantPeriode = unFavoriOffreEmploi({
        id: 1,
        idOffre: 'id-offre-favori-cree-pendant-periode',
        idJeune,
        dateCreation: debut.plus({ day: 1 }).toJSDate(),
        dateCandidature: null
      })
      const favoriCandidatePendantPeriode = unFavoriOffreEmploi({
        id: 2,
        idOffre: 'id-offre-favori-candidate-pendant-periode',
        idJeune,
        dateCreation: debut.minus({ day: 1 }).toJSDate(),
        dateCandidature: debut.plus({ day: 1 }).toJSDate()
      })
      const favoriCreeTropTot = unFavoriOffreEngagement({
        id: 3,
        idOffre: 'id-offre-favori-cree-trop-tot',
        idJeune,
        dateCreation: debut.minus({ day: 2 }).toJSDate(),
        dateCandidature: null
      })
      const favoriCreeTopTard = unFavoriOffreImmersion({
        id: 4,
        idOffre: 'id-offre-favori-cree-top-tard',
        idJeune,
        dateCreation: fin.plus({ day: 2 }).toJSDate(),
        dateCandidature: null
      })
      const favoriToto = unFavoriOffreImmersion({
        id: 5,
        idOffre: 'id-offre-favori-toto',
        idJeune,
        dateCreation: debut.plus({ day: 1 }).toJSDate(),
        dateCandidature: fin.plus({ day: 3 }).toJSDate()
      })

      await FavoriOffreEmploiSqlModel.bulkCreate([
        favoriCreePendantPeriode,
        favoriCandidatePendantPeriode
      ])
      await FavoriOffreEngagementSqlModel.bulkCreate([favoriCreeTropTot])
      await FavoriOffreImmersionSqlModel.bulkCreate([
        favoriCreeTopTard,
        favoriToto
      ])

      // When
      const query: GetFavorisJeuneQuery = {
        idJeune: jeuneDto.id,
        dateDebut: debut,
        dateFin: fin
      }
      const result = await getFavorisJeuneQueryHandler.handle(query)

      // Then
      expect(result).to.have.length(2)
      expect(result[0]).to.include({
        idOffre: 'id-offre-favori-cree-pendant-periode'
      })
      expect(result[1]).to.include({
        idOffre: 'id-offre-favori-candidate-pendant-periode'
      })
    })
  })

  describe('authorize', () => {
    describe("quand c'est un conseiller MILO ou PASS_EMPLOI", () => {
      it('valide le conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })

        const query = {
          idJeune: 'id-jeune'
        }

        // When
        await getFavorisJeuneQueryHandler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMiloAvecPartageFavoris
        ).to.have.been.calledWithExactly('id-jeune', utilisateur)
      })
    })
  })
})
