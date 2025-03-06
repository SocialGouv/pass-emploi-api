import { DateTime } from 'luxon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetFavorisOffresImmersionJeuneQueryHandler } from '../../../src/application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import { FavoriOffreImmersionQueryModel } from '../../../src/application/queries/query-models/offres-immersion.query-model'
import { FavorisOffresImmersionSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  unFavoriOffreImmersion,
  unFavoriOffreImmersionQueryModelObsolete
} from '../../fixtures/offre-immersion.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetFavorisOffresImmersionJeuneQueryHandler', () => {
  const idJeune = 'ABCDE'
  let getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    await getDatabase().cleanPG()
    // Given
    await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: idJeune,
        idConseiller: 'ZIDANE'
      })
    )
    const offresImmersionRepository = new FavorisOffresImmersionSqlRepository()
    await offresImmersionRepository.save({
      idBeneficiaire: idJeune,
      offre: unFavoriOffreImmersion(),
      dateCreation: DateTime.now()
    })

    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getFavorisOffresImmersionJeuneQueryHandler =
      new GetFavorisOffresImmersionJeuneQueryHandler(jeuneAuthorizer)
  })

  describe('handle', () => {
    describe('avec détail', () => {
      it('recupère le détail de tous les favoris immersions du jeune', async () => {
        // Given
        const expectedResult: FavoriOffreImmersionQueryModel[] = [
          unFavoriOffreImmersionQueryModelObsolete()
        ]

        // When
        const result = await getFavorisOffresImmersionJeuneQueryHandler.handle({
          idJeune,
          detail: true
        })
        // Then

        expect(result).to.deep.equal(expectedResult)
      })
    })

    describe('sans détail', () => {
      it('recupère tous les favoris immersions du jeune', async () => {
        // Given
        const expectedResult: FavoriOffreImmersionQueryModel[] = [
          {
            id: unFavoriOffreImmersionQueryModelObsolete().id,
            dateCandidature: undefined
          }
        ]

        // When
        const result = await getFavorisOffresImmersionJeuneQueryHandler.handle({
          idJeune,
          detail: false
        })

        // Then
        expect(result).to.deep.equal(expectedResult)
      })
    })
  })

  describe('authorize', () => {
    it('authorize un jeune', () => {
      // When
      getFavorisOffresImmersionJeuneQueryHandler.authorize(
        {
          idJeune,
          detail: true
        },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        idJeune,
        unUtilisateurJeune()
      )
    })
  })
})
