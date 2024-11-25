import { ConseillerSqlModel } from '../../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../../../utils'
import { getDatabase } from '../../../../utils/database-for-testing'
import {
  GetFavorisAccueilQuery,
  GetFavorisAccueilQueryGetter
} from '../../../../../src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { AsSql } from '../../../../../src/infrastructure/sequelize/types'
import {
  unFavoriOffreEmploi,
  unFavoriOffreImmersion
} from '../../../../fixtures/sql-models/favoris.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavorisQueryModel } from '../../../../../src/application/queries/query-models/favoris.query-model'
import { Offre } from '../../../../../src/domain/offre/offre'
import { FavoriOffreImmersionSqlModel } from '../../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { DateTime } from 'luxon'

describe('GetFavorisAccueilQueryGetter', () => {
  let getFavorisAccueilQueryGetter: GetFavorisAccueilQueryGetter

  beforeEach(async () => {
    await getDatabase().cleanPG()
    getFavorisAccueilQueryGetter = new GetFavorisAccueilQueryGetter()
  })

  describe('handle', () => {
    let jeuneDto: AsSql<JeuneDto>

    const idJeune = 'idJeune'
    const idConseiller = 'id-conseiller'

    const query: GetFavorisAccueilQuery = {
      idJeune: 'idJeune'
    }

    beforeEach(async () => {
      const conseillerDto = unConseillerDto({ id: idConseiller })
      await ConseillerSqlModel.creer(conseillerDto)
      jeuneDto = unJeuneDto({
        id: idJeune,
        idConseiller
      })
      await JeuneSqlModel.creer(jeuneDto)
    })

    it('renvoie les 3 favoris les plus récents', async () => {
      // Given
      const dateInitiale: DateTime = DateTime.fromISO('2023-04-14T23:15:00Z')

      const idOffreEmploiDb = 1
      const idImmersion1 = 1

      const favoriSansDateCreationDto = unFavoriOffreEmploi({
        id: 12,
        idOffre: 'id-offre-sans-date',
        titre: 'titre-1',
        nomEntreprise: 'entreprise',
        idJeune,
        dateCreation: null
      })
      const favoriAncienDe1jourDto = unFavoriOffreEmploi({
        id: idOffreEmploiDb,
        idOffre: 'id-offre-1',
        titre: 'titre-1',
        nomEntreprise: 'entreprise',
        idJeune,
        dateCreation: dateInitiale.minus({ days: 1 }).toJSDate()
      })

      const favoriAncienDe4joursDto = unFavoriOffreImmersion({
        id: idImmersion1,
        idOffre: 'poi-id-offre',
        metier: 'poi-metier-2e-dans-la-liste-triee',
        nomEtablissement: 'poi-etablissement',
        ville: 'marseille',
        idJeune,
        dateCreation: dateInitiale.minus({ days: 4 }).toJSDate()
      })

      await Promise.all([
        await FavoriOffreEmploiSqlModel.create(favoriSansDateCreationDto),
        await FavoriOffreEmploiSqlModel.create(favoriAncienDe1jourDto),
        await FavoriOffreImmersionSqlModel.create(favoriAncienDe4joursDto)
      ])

      const favoriAncienDe1jour: FavorisQueryModel = {
        idOffre: 'id-offre-1',
        titre: 'titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'entreprise',
        localisation: undefined,
        dateCreation: dateInitiale.minus({ days: 1 }).toISO(),
        tags: ['aa', '2 ans'],
        origine: undefined
      }
      const favoriAncienDe4jours: FavorisQueryModel = {
        idOffre: 'poi-id-offre',
        titre: 'poi-metier-2e-dans-la-liste-triee',
        type: Offre.Favori.Type.IMMERSION,
        organisation: 'poi-etablissement',
        localisation: 'marseille',
        dateCreation: dateInitiale.minus({ days: 4 }).toISO(),
        tags: ['patisserie']
      }
      const favoriSansDateCreation: FavorisQueryModel = {
        idOffre: 'id-offre-sans-date',
        titre: 'titre-1',
        type: Offre.Favori.Type.EMPLOI,
        organisation: 'entreprise',
        localisation: undefined,
        dateCreation: undefined,
        tags: ['aa', '2 ans'],
        origine: undefined
      }
      const listeAttendue = [
        favoriAncienDe1jour,
        favoriAncienDe4jours,
        favoriSansDateCreation
      ]

      // When
      const listeFavorisObtenue = await getFavorisAccueilQueryGetter.handle(
        query
      )

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })
  })
})
