import { SinonSandbox } from 'sinon'
import { GetJeunesByStructureMiloQueryHandler } from 'src/application/queries/get-jeunes-by-structure-milo.query.handler.db'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { ConseillerInterStructureMiloAuthorizer } from '../../../src/application/authorizers/conseiller-inter-structure-milo-authorizer'
import { success } from '../../../src/building-blocks/types/result'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { StructureMiloSqlModel } from '../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'
import { uneStructureMiloDto } from '../../fixtures/sql-models/structure-milo.sql-model'

describe('GetJeunesByStructureMiloQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let conseillerStructureMiloAuthorizer: StubbedClass<ConseillerInterStructureMiloAuthorizer>

  let getJeunesByStructureMiloQueryHandler: GetJeunesByStructureMiloQueryHandler
  let sandbox: SinonSandbox

  before(async () => {
    databaseForTesting = getDatabase()
    sandbox = createSandbox()
    conseillerStructureMiloAuthorizer = stubClass(
      ConseillerInterStructureMiloAuthorizer
    )

    getJeunesByStructureMiloQueryHandler =
      new GetJeunesByStructureMiloQueryHandler(
        conseillerStructureMiloAuthorizer
      )
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idStructureMilo = 'struct'

    it("retourne les jeunes d'un établissement", async () => {
      // Given
      await StructureMiloSqlModel.create(
        uneStructureMiloDto({ id: idStructureMilo })
      )
      await StructureMiloSqlModel.create(
        uneStructureMiloDto({ id: 'autre-struct' })
      )

      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '1', idStructureMilo })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'jeune-conseiller-1',
          idConseiller: '1',
          prenom: 'Alice'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '2', idStructureMilo })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'jeune-conseiller-2',
          idConseiller: '2',
          prenom: 'Béatrice'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '3', idStructureMilo: 'autre-struct' })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({ id: 'jeune-conseiller-3', idConseiller: '3' })
      )

      // When
      const actual = await getJeunesByStructureMiloQueryHandler.handle({
        idStructureMilo: idStructureMilo
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          unJeuneQueryModel({
            id: 'jeune-conseiller-1',
            firstName: 'Alice',
            idConseiller: '1'
          }),
          unJeuneQueryModel({
            id: 'jeune-conseiller-2',
            firstName: 'Béatrice',
            idConseiller: '2'
          })
        ])
      )
    })

    it("retourne tableau vide quand la structure Milo n'existe pas", async () => {
      const actual = await getJeunesByStructureMiloQueryHandler.handle({
        idStructureMilo: 'id-inexistant'
      })

      expect(actual).to.deep.equal(success([]))
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller sur sa structure Milo', () => {
      // Whem
      getJeunesByStructureMiloQueryHandler.authorize(
        { idStructureMilo: 'paris' },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerStructureMiloAuthorizer.autoriserConseillerPourUneStructureMilo
      ).to.have.been.calledWithExactly('paris', unUtilisateurConseiller())
    })
  })
})
