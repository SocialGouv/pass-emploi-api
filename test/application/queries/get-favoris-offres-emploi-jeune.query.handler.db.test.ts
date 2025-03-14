import { DateTime } from 'luxon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetFavorisOffresEmploiJeuneQueryHandler } from '../../../src/application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { Offre } from '../../../src/domain/offre/offre'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetFavorisOffresEmploiJeuneQueryHandler', () => {
  let offresEmploiHttpSqlRepository: Offre.Favori.Emploi.Repository
  let getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    await getDatabase().cleanPG()

    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getFavorisOffresEmploiJeuneQueryHandler =
      new GetFavorisOffresEmploiJeuneQueryHandler(jeuneAuthorizer)
  })

  it('renvoie la liste des favoris', async () => {
    // Given
    const now = DateTime.now()

    await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: 'ABCDE',
        idConseiller: 'ZIDANE'
      })
    )
    const offreEmploi = uneOffreEmploi()
    const favori: Offre.Favori<Offre.Favori.Emploi> = {
      idBeneficiaire: 'ABCDE',
      offre: offreEmploi,
      dateCreation: now,
      dateCandidature: now
    }
    await offresEmploiHttpSqlRepository.save(favori)

    // When
    const favoris = await getFavorisOffresEmploiJeuneQueryHandler.handle({
      idJeune: 'ABCDE'
    })

    // Then
    expect(favoris).to.deep.equal([
      { id: '123DXPM', dateCandidature: now.toISO() }
    ])
  })
})
