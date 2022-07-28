import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unFavoriOffreEmploi } from '../../fixtures/sql-models/favoris.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { expect } from '../../utils'
import { GetFavorisJeunePourConseillerQueryHandler } from '../../../src/application/queries/get-favoris-jeune-pour-conseiller.query.handler'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavorisQueryModel } from '../../../src/application/queries/query-models/favoris.query-model'

describe('GetFavorisJeunePourConseillerQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getFavorisJeunePourConseillerQueryHandler: GetFavorisJeunePourConseillerQueryHandler

  beforeEach(() => {
    getFavorisJeunePourConseillerQueryHandler =
      new GetFavorisJeunePourConseillerQueryHandler()
  })

  describe('handle', () => {
    const idJeune = 'poi-id-jeune'
    const idConseiller = 'poi-id-conseiller'

    it('retourne un favori du jeune', async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: idConseiller })
      await ConseillerSqlModel.creer(conseillerDto)
      const jeuneDto = unJeuneDto({
        id: idJeune,
        idConseiller
      })
      await JeuneSqlModel.creer(jeuneDto)

      const favoriDb = unFavoriOffreEmploi({
        idOffre: 'poi-id-offre',
        titre: 'poi-titre',
        nomEntreprise: 'poi-entreprise',
        idJeune
      })
      await FavoriOffreEmploiSqlModel.create(favoriDb)

      const favori: FavorisQueryModel = {
        idOffre: 'poi-id-offre',
        titre: 'poi-titre',
        entreprise: 'poi-entreprise',
        localisation: undefined
      }
      const listeAttendue = [favori]

      const query = { idJeune: jeuneDto.id }
      // When
      const listeFavorisObtenue =
        await getFavorisJeunePourConseillerQueryHandler.handle(query)

      // Then
      expect(listeFavorisObtenue).to.deep.equal(listeAttendue)
    })
  })
})
