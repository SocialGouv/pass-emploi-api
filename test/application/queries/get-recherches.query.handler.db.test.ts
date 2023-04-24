import { ConseillerInterAgenceAuthorizer } from '../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetRecherchesQueryHandler } from '../../../src/application/queries/get-recherches.query.handler.db'
import { Core } from '../../../src/domain/core'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/offre/recherche/recherche-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import {
  criteresImmersionNice,
  geometrieNice,
  uneRecherche
} from '../../fixtures/recherche.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'

describe('GetRecherchesQueryHandler', () => {
  let database: DatabaseForTesting

  before(async () => {
    database = getDatabase()
  })

  let getRecherchesQueryHandler: GetRecherchesQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>

  beforeEach(async () => {
    await database.cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    getRecherchesQueryHandler = new GetRecherchesQueryHandler(
      jeuneAuthorizer,
      conseillerAgenceAuthorizer
    )
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
        await getRecherchesQueryHandler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMiloAvecPartageFavoris
        ).to.have.been.calledWithExactly('id-jeune', utilisateur)
      })
    })
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
          dateCreation: uneDatetime().toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime().toJSDate()
        })
      )
      const rechercheSqlRepository = new RechercheSqlRepository(
        database.sequelize
      )
      await rechercheSqlRepository.save(recherche)
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
