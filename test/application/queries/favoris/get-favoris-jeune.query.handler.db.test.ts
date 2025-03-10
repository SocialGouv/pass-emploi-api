import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import { GetFavorisJeuneQueryHandler } from '../../../../src/application/queries/favoris/get-favoris-jeune.query.handler.db'
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

  const idJeune = 'poi-id-jeune'
  const idConseiller = 'poi-id-conseiller'

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
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-1',
        nomEntreprise: 'poi-entreprise',
        idJeune,
        dateCreation: now.toJSDate(),
        dateCandidature: now.toJSDate()
      })
      const favoriOffreAlternanceDb = unFavoriOffreEmploi({
        id: idOffreAlternanceDb,
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-2',
        nomEntreprise: 'poi-entreprise',
        isAlternance: true,
        idJeune,
        dateCreation: now.plus({ minutes: 1 }).toJSDate()
      })
      await FavoriOffreEmploiSqlModel.create(favoriOffreEmploiDb)
      await FavoriOffreEmploiSqlModel.create(favoriOffreAlternanceDb)

      const favoriOffreEmploi: FavorisQueryModel = {
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'poi-entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans'],
        dateCreation: now.toISO(),
        dateCandidature: now.toISO(),
        origine: undefined
      }
      const favoriOffreAlternance: FavorisQueryModel = {
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-2',
        type: Offre.Favori.Type.ALTERNANCE,
        organisation: 'poi-entreprise',
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
        idOffre: 'poi-id-offre-1',
        metier: 'poi-titre-4',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: now.toJSDate(),
        dateCandidature: now.toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb1)
      const favoriOffreImmersionDb2 = unFavoriOffreImmersion({
        id: 2,
        idOffre: 'poi-id-offre-2',
        metier: 'poi-titre-3',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: now.plus({ days: 1 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb2)

      const favoriOffreImmersion1: FavorisQueryModel = {
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-4',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.toISO(),
        dateCandidature: now.toISO()
      }
      const favoriOffreImmersion2: FavorisQueryModel = {
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-3',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 1 }).toISO(),
        dateCandidature: undefined
      }

      const idOffreEmploiDb = 1
      const idOffreAlternanceDb = 2

      const favoriOffreEmploiDb = unFavoriOffreEmploi({
        id: idOffreEmploiDb,
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-1',
        nomEntreprise: 'poi-entreprise',
        idJeune,
        dateCreation: now.plus({ days: 2 }).toJSDate()
      })
      const favoriOffreAlternanceDb = unFavoriOffreEmploi({
        id: idOffreAlternanceDb,
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-2',
        nomEntreprise: 'poi-entreprise',
        isAlternance: true,
        idJeune,
        dateCreation: now.plus({ days: 3 }).toJSDate()
      })
      await FavoriOffreEmploiSqlModel.create(favoriOffreEmploiDb)
      await FavoriOffreEmploiSqlModel.create(favoriOffreAlternanceDb)

      const favoriOffreEmploi: FavorisQueryModel = {
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'poi-entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans'],
        dateCreation: now.plus({ days: 2 }).toISO(),
        dateCandidature: undefined,
        origine: undefined
      }
      const favoriOffreAlternance: FavorisQueryModel = {
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-2',
        type: Offre.Favori.Type.ALTERNANCE,
        organisation: 'poi-entreprise',
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
        idOffre: 'poi-id-offre-1',
        metier: 'poi-metier-first-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().plus({ days: 1 }).toJSDate(),
        dateCandidature: uneDatetime().plus({ days: 2 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb1)
      const favoriOffreImmersionDb2 = unFavoriOffreImmersion({
        id: 2,
        idOffre: 'poi-id-offre-2',
        metier: 'poi-metier-2e-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().plus({ days: 2 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb2)
      const favoriOffreImmersionDb3 = unFavoriOffreImmersion({
        id: 3,
        idOffre: 'poi-id-offre-3',
        metier: 'poi-metier-1er-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().plus({ days: 3 }).toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb3)
      const favoriOffreImmersionDb0 = unFavoriOffreImmersion({
        id: 0,
        idOffre: 'poi-id-offre-0',
        metier: 'poi-metier-0e-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: uneDatetime().toJSDate()
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb0)

      const favoriOffreImmersion1: FavorisQueryModel = {
        idOffre: 'poi-id-offre-1',
        titre: 'poi-metier-first-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 1 }).toISO(),
        dateCandidature: now.plus({ days: 2 }).toISO()
      }
      const favoriOffreImmersion0: FavorisQueryModel = {
        idOffre: 'poi-id-offre-0',
        titre: 'poi-metier-0e-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.toISO(),
        dateCandidature: undefined
      }
      const favoriOffreImmersion2: FavorisQueryModel = {
        idOffre: 'poi-id-offre-2',
        titre: 'poi-metier-2e-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie'],
        dateCreation: now.plus({ days: 2 }).toISO(),
        dateCandidature: undefined
      }
      const favoriOffreImmersion3: FavorisQueryModel = {
        idOffre: 'poi-id-offre-3',
        titre: 'poi-metier-1er-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
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
        idOffre: 'poi-id-offre',
        titre: 'poi-titre',
        idJeune,
        dateCreation: now.toJSDate()
      })
      await FavoriOffreEngagementSqlModel.create(favoriOffreServiceCiviqueDb)

      const favoriOffreServiceCivique: FavorisQueryModel = {
        idOffre: 'poi-id-offre',
        titre: 'poi-titre',
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
