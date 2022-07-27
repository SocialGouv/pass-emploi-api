import { expect, StubbedClass, stubClass } from '../../utils'
import { GetRecherchesQueryHandler } from '../../../src/application/queries/get-recherches.query.handler.db'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import {
  criteresImmersionNice,
  geometrieNice,
  uneRecherche
} from '../../fixtures/recherche.fixture'
import { Recherche } from '../../../src/domain/recherche'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/recherche-sql.repository.db'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'

describe('GetRecherchesQueryHandler', () => {
  const database = DatabaseForTesting.prepare()
  let getRecherchesQueryHandler: GetRecherchesQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>

  before(async () => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    getRecherchesQueryHandler = new GetRecherchesQueryHandler(
      conseillerForJeuneAuthorizer,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    // Given
    const recherche = uneRecherche({
      idJeune: 'idJeune',
      type: Recherche.Type.OFFRES_IMMERSION,
      criteres: criteresImmersionNice
    })

    beforeEach(async () => {
      // Given
      const conseillerDto = unConseillerDto()
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'idJeune',
          idConseiller: conseillerDto.id,
          dateCreation: uneDatetime.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate()
        })
      )
      const rechercheSqlRepository = new RechercheSqlRepository(
        database.sequelize
      )
      await rechercheSqlRepository.createRecherche(recherche)
    })

    context('sans géométrie', () => {
      it('récupère une recherche sauvegardée sans sa géométrie', async () => {
        // When
        const recherches = await getRecherchesQueryHandler.handle({
          idJeune: recherche.idJeune,
          avecGeometrie: false
        })

        // Then
        expect(recherches.length).to.equal(1)
        expect(recherches[0].id).to.deep.equal(recherche.id)
        expect(recherches[0].geometrie).to.equal(undefined)
      })
    })
    context('avec géométrie', () => {
      it('récupère une recherche sauvegardée avec sa géométrie', async () => {
        // When
        const recherches = await getRecherchesQueryHandler.handle({
          idJeune: recherche.idJeune,
          avecGeometrie: true
        })

        // Then
        expect(recherches.length).to.equal(1)
        expect(recherches[0].geometrie!.coordinates).to.deep.equal(
          geometrieNice
        )
      })
    })
  })
})
