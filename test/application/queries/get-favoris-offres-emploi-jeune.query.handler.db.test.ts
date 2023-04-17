import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import {
  uneOffreEmploi,
  uneOffreEmploiResumeQueryModel
} from '../../fixtures/offre-emploi.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { GetFavorisOffresEmploiJeuneQueryHandler } from '../../../src/application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { Offre } from '../../../src/domain/offre/offre'
import { getDatabase } from '../../utils/database-for-testing'
import { DateService } from '../../../src/utils/date-service'

describe('GetFavorisOffresEmploiJeuneQueryHandler', () => {
  let offresEmploiHttpSqlRepository: Offre.Favori.Emploi.Repository
  let getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let dateService: StubbedClass<DateService>

  beforeEach(async () => {
    await getDatabase().cleanPG()

    dateService = stubClass(DateService)
    dateService.nowJs.returns(new Date('2023-04-17T12:00:00Z'))
    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository(
      dateService
    )
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getFavorisOffresEmploiJeuneQueryHandler =
      new GetFavorisOffresEmploiJeuneQueryHandler(jeuneAuthorizer)
  })

  describe('quand on veut les id uniquement', () => {
    let offreEmploi: Offre.Favori.Emploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreEmploi = uneOffreEmploi()
      await offresEmploiHttpSqlRepository.save('ABCDE', offreEmploi)
    })

    describe('quand le jeune a des favoris', () => {
      it('renvoie liste des ids', async () => {
        // When
        const favorisIds = await getFavorisOffresEmploiJeuneQueryHandler.handle(
          {
            idJeune: 'ABCDE',
            detail: false
          }
        )

        // Then
        expect(favorisIds).to.deep.equal([{ id: '123DXPM' }])
      })
    })
  })

  describe('quand on veut le détail', () => {
    let offreEmploi: Offre.Favori.Emploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreEmploi = uneOffreEmploi()
      await offresEmploiHttpSqlRepository.save('ABCDE', offreEmploi)
    })

    describe('quand le jeune a des favoris', () => {
      it('renvoie liste des favoris', async () => {
        const offreEmploiResumeQueryModel = uneOffreEmploiResumeQueryModel()

        // When
        const favoris = await getFavorisOffresEmploiJeuneQueryHandler.handle({
          idJeune: 'ABCDE',
          detail: true
        })

        // Then
        expect(favoris).to.deep.equal([offreEmploiResumeQueryModel])
      })
    })
  })
})
