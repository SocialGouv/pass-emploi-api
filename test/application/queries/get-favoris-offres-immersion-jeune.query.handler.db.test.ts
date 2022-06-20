import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import {
  uneOffreImmersion,
  uneOffreImmersionQueryModel
} from '../../fixtures/offre-immersion.fixture'
import {
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from '../../../src/application/queries/query-models/offres-immersion.query-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { OffresImmersionHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-immersion-http-sql.repository.db'
import { ImmersionClient } from '../../../src/infrastructure/clients/immersion-client'
import { GetFavorisOffresImmersionJeuneQueryHandler } from '../../../src/application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'

describe('GetFavorisOffresImmersionJeuneQueryHandler', () => {
  DatabaseForTesting.prepare()

  const idJeune = 'ABCDE'
  let getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    // Given
    await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: idJeune,
        idConseiller: 'ZIDANE'
      })
    )
    const immersionClient = stubClass(ImmersionClient)
    const offresImmersionRepository = new OffresImmersionHttpSqlRepository(
      immersionClient
    )
    await offresImmersionRepository.saveAsFavori(idJeune, uneOffreImmersion())

    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getFavorisOffresImmersionJeuneQueryHandler =
      new GetFavorisOffresImmersionJeuneQueryHandler(jeuneAuthorizer)
  })

  describe('handle', () => {
    describe('avec détail', () => {
      it('recupère tous les favoris immersions du jeune', async () => {
        // Given
        const expectedResult: OffreImmersionQueryModel[] = [
          uneOffreImmersionQueryModel()
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
          { id: uneOffreImmersionQueryModel().id }
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
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        idJeune,
        unUtilisateurJeune()
      )
    })
  })
})
