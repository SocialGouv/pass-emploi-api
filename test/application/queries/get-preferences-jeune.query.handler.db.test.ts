import { expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { success } from '../../../src/building-blocks/types/result'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { GetPreferencesJeuneQueryHandler } from '../../../src/application/queries/get-preferences-jeune.query.handler.db'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { IdService } from '../../../src/utils/id-service'
import { DateService } from '../../../src/utils/date-service'
import { PreferencesJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-model'
import { before } from 'mocha'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'

describe('GetPreferencesJeuneQueryHandler', () => {
  let database: DatabaseForTesting
  before(() => {
    database = getDatabase()
  })

  let getPreferencesJeuneQueryHandler: GetPreferencesJeuneQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    await database.cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getPreferencesJeuneQueryHandler = new GetPreferencesJeuneQueryHandler(
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    const jeune = unJeune()

    beforeEach(async () => {
      // Given
      const conseillerRepository = new ConseillerSqlRepository()
      await conseillerRepository.save(unConseiller())
      const firebaseClient = stubClass(FirebaseClient)
      const jeuneRepository = new JeuneSqlRepository(
        database.sequelize,
        firebaseClient,
        new IdService(),
        new DateService()
      )
      await jeuneRepository.save(jeune)
    })

    it('renvoie les préférences du jeune', async () => {
      // When
      const result = await getPreferencesJeuneQueryHandler.handle({
        idJeune: jeune.id
      })

      // Then
      const expected: PreferencesJeuneQueryModel = {
        partageFavoris: true,
        alertesOffres: true,
        messages: true,
        creationActionConseiller: true,
        rendezVousSessions: true,
        rappelActions: true
      }
      expect(result).to.deep.equal(success(expected))
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // When
      await getPreferencesJeuneQueryHandler.authorize(
        { idJeune: 'idJeune' },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        unUtilisateurJeune()
      )
    })
  })
})
