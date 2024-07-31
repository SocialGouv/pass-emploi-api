import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo.db'
import { GetCompteursBeneficiaireMiloQueryHandler } from 'src/application/queries/get-compteurs-portefeuille-milo.query.handler.db'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { DateTime } from 'luxon'
import { success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import Structure = Core.Structure
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'

describe('GetCompteursPortefeuilleMiloQueryHandler', () => {
  let getCompteursPortefeuilleMiloQueryHandler: GetCompteursBeneficiaireMiloQueryHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let databaseForTesting: DatabaseForTesting
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getCompteursPortefeuilleMiloQueryHandler =
      new GetCompteursBeneficiaireMiloQueryHandler(
        conseillerAuthorizer,
        conseillerRepository,
        databaseForTesting.sequelize
      )
  })

  afterEach(async () => {
    await getDatabase().cleanPG()
  })

  after(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      //Given
      const query = {
        idConseiller: 'idConseiller',
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2024-07-01'),
        dateFin: DateTime.fromISO('2024-07-26')
      }

      // When
      getCompteursPortefeuilleMiloQueryHandler.authorize(
        query,
        unUtilisateurConseiller({ structure: Structure.MILO })
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller({ structure: Structure.MILO }),
        true
      )
    })
  })

  describe('handle', () => {
    it('récupère les compteurs pour le portefeuille Milo', async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({ structure: Structure.MILO })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'beneficiaire-id',
          structure: Core.Structure.MILO,
          instanceId: 'instanceId'
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'beneficiaire-id',
          dateCreation: new Date('2024-07-01')
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'beneficiaire-id',
          dateCreation: new Date('2024-07-02')
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'beneficiaire-id',
          dateCreation: new Date('2024-07-03')
        })
      )

      const query = {
        idConseiller: 'idConseiller',
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2024-07-01'),
        dateFin: DateTime.fromISO('2024-07-26')
      }
      const user = unUtilisateurConseiller({ structure: Structure.MILO })

      // When
      const result = await getCompteursPortefeuilleMiloQueryHandler.handle(
        query,
        user
      )

      // Then
      expect(result).to.deep.equal(
        success([
          {
            idBeneficiaire: 'beneficiaire-id',
            actions: '3'
          }
        ])
      )
    })
  })
})
