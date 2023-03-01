import { getDatabase } from '../../../utils/database-for-testing'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from '../../../fixtures/sql-models/favoris.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { GetFavorisJeuneQueryHandler } from '../../../../src/application/queries/favoris/get-favoris-jeune.query.handler.db'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavorisQueryModel } from '../../../../src/application/queries/query-models/favoris.query-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { FavoriOffreImmersionSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { ConseillerForJeuneAvecPartageAuthorizer } from '../../../../src/application/authorizers/authorize-conseiller-for-jeune-avec-partage'
import { Offre } from '../../../../src/domain/offre/offre'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/authorize-jeune'

describe('GetFavorisJeunePourConseillerQueryHandler', () => {
  let conseillerForJeuneAvecPartageAuthorizer: StubbedClass<ConseillerForJeuneAvecPartageAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getFavorisJeunePourConseillerQueryHandler: GetFavorisJeuneQueryHandler

  const idJeune = 'poi-id-jeune'
  const idConseiller = 'poi-id-conseiller'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    conseillerForJeuneAvecPartageAuthorizer = stubClass(
      ConseillerForJeuneAvecPartageAuthorizer
    )
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getFavorisJeunePourConseillerQueryHandler = new GetFavorisJeuneQueryHandler(
      conseillerForJeuneAvecPartageAuthorizer,
      jeuneAuthorizer
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
      const listeFavorisObtenue =
        await getFavorisJeunePourConseillerQueryHandler.handle(query)

      // Then
      expect(listeFavorisObtenue).to.deep.equal([])
    })
    it('retourne une liste de deux favoris, une offre emploi et une offre alternance, triés par titre croissant', async () => {
      // Given
      const idOffreEmploiDb = 1
      const idOffreAlternanceDb = 2
      const favoriOffreEmploiDb = unFavoriOffreEmploi({
        id: idOffreEmploiDb,
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-1',
        nomEntreprise: 'poi-entreprise',
        idJeune
      })
      const favoriOffreAlternanceDb = unFavoriOffreEmploi({
        id: idOffreAlternanceDb,
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-2',
        nomEntreprise: 'poi-entreprise',
        isAlternance: true,
        idJeune
      })
      await FavoriOffreEmploiSqlModel.create(favoriOffreEmploiDb)
      await FavoriOffreEmploiSqlModel.create(favoriOffreAlternanceDb)

      const favoriOffreEmploi: FavorisQueryModel = {
        idOffre: 'poi-id-offre-1',
        titre: 'poi-titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'poi-entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans']
      }
      const favoriOffreAlternance: FavorisQueryModel = {
        idOffre: 'poi-id-offre-2',
        titre: 'poi-titre-2',
        type: Offre.Favori.Type.ALTERNANCE,
        organisation: 'poi-entreprise',
        localisation: undefined,
        tags: ['aa', '2 ans']
      }
      const listeAttendue = [favoriOffreEmploi, favoriOffreAlternance]

      const query = { idJeune: jeuneDto.id }
      // When
      const listeFavorisObtenue =
        await getFavorisJeunePourConseillerQueryHandler.handle(query)

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })
    it('retourne une liste de deux favoris offre immersion du jeune, triés par titre croissant', async () => {
      // Given
      const idImmersion1 = 1
      const idImmersion2 = 2
      const favoriOffreImmersionDb1 = unFavoriOffreImmersion({
        id: idImmersion1,
        idOffre: 'poi-id-offre',
        metier: 'poi-metier-2e-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb1)
      const favoriOffreImmersionDb2 = unFavoriOffreImmersion({
        id: idImmersion2,
        idOffre: 'poi-id-offre',
        metier: 'poi-metier-1er-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune
      })
      await FavoriOffreImmersionSqlModel.create(favoriOffreImmersionDb2)

      const favoriOffreImmersion1: FavorisQueryModel = {
        idOffre: 'poi-id-offre',
        titre: 'poi-metier-2e-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie']
      }
      const favoriOffreImmersion2: FavorisQueryModel = {
        idOffre: 'poi-id-offre',
        titre: 'poi-metier-1er-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        tags: ['patisserie']
      }
      const listeAttendue = [favoriOffreImmersion1, favoriOffreImmersion2]

      const query = { idJeune: jeuneDto.id }

      // When
      const listeFavorisObtenue =
        await getFavorisJeunePourConseillerQueryHandler.handle(query)

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })
    it("retourne une liste d'un favori offre service civique du jeune", async () => {
      // Given
      const favoriOffreServiceCiviqueDb = unFavoriOffreEngagement({
        idOffre: 'poi-id-offre',
        titre: 'poi-titre',
        idJeune
      })
      await FavoriOffreEngagementSqlModel.create(favoriOffreServiceCiviqueDb)

      const favoriOffreServiceCivique: FavorisQueryModel = {
        idOffre: 'poi-id-offre',
        titre: 'poi-titre',
        type: Offre.Favori.Type.SERVICE_CIVIQUE,
        organisation: undefined,
        localisation: undefined,
        tags: ['infra']
      }
      const listeAttendue = [favoriOffreServiceCivique]

      const query = { idJeune: jeuneDto.id }

      // When
      const listeFavorisObtenue =
        await getFavorisJeunePourConseillerQueryHandler.handle(query)

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })
  })
})
