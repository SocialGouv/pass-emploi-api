import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetFavorisOffresImmersionJeuneQueryHandler } from '../../../src/application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import {
  FavoriOffreImmersionIdQueryModel,
  FavoriOffreImmersionQueryModel
} from '../../../src/application/queries/query-models/offres-immersion.query-model'
import { FavorisOffresImmersionSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  unFavoriOffreImmersion,
  unFavoriOffreImmersionQueryModel
} from '../../fixtures/offre-immersion.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { DateService } from '../../../src/utils/date-service'

describe('GetFavorisOffresImmersionJeuneQueryHandler', () => {
  const idJeune = 'ABCDE'
  let getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let dateService: StubbedClass<DateService>

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
    dateService = stubClass(DateService)
    dateService.nowJs.returns(new Date('2023-04-17T12:00:00Z'))
    const offresImmersionRepository = new FavorisOffresImmersionSqlRepository(
      dateService
    )
    await offresImmersionRepository.save(idJeune, unFavoriOffreImmersion())

    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getFavorisOffresImmersionJeuneQueryHandler =
      new GetFavorisOffresImmersionJeuneQueryHandler(jeuneAuthorizer)
  })

  describe('handle', () => {
    describe('avec détail', () => {
      it('recupère tous les favoris immersions du jeune', async () => {
        // Given
        const expectedResult: FavoriOffreImmersionQueryModel[] = [
          unFavoriOffreImmersionQueryModel()
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
      it('recupère tous les ids des favoris immersions du jeune', async () => {
        // Given
        const expectedResult: FavoriOffreImmersionIdQueryModel[] = [
          { id: unFavoriOffreImmersionQueryModel().id }
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
