import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  GetDetailConseillerQuery,
  GetDetailConseillerQueryHandler
} from '../../../src/application/queries/get-detail-conseiller.query.handler.db'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetDetailConseillerQueryHandler', () => {
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getDetailConseillerQueryHandler = new GetDetailConseillerQueryHandler(
      conseillerAuthorizer
    )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne le conseiller quand il existe', async () => {
      const idConseiller = '1'
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: idConseiller, prenom: 'toto', nom: 'tata' })
      )

      const actual = await getDetailConseillerQueryHandler.handle({
        idConseiller: idConseiller
      })

      expect(actual).to.deep.equal(
        detailConseillerQueryModel({
          id: idConseiller,
          firstName: 'toto',
          lastName: 'tata',
          email: 'nils.tavernier@passemploi.com',
          agence: undefined,
          notificationsSonores: false
        })
      )
    })

    it('retourne un conseiller avec des jeunes à récupérer', async () => {
      const idConseiller = '1'
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: idConseiller, prenom: 'toto', nom: 'tata' })
      )

      await JeuneSqlModel.creer(
        unJeuneDto({ idConseillerInitial: idConseiller })
      )

      const actual = await getDetailConseillerQueryHandler.handle({
        idConseiller: idConseiller
      })

      expect(actual).to.deep.equal(
        detailConseillerQueryModel({
          id: idConseiller,
          firstName: 'toto',
          lastName: 'tata',
          email: 'nils.tavernier@passemploi.com',
          agence: undefined,
          notificationsSonores: false,
          aDesBeneficiairesARecuperer: true
        })
      )
    })

    it("retourne undefined quand le conseiller n'existe pas", async () => {
      const actual = await getDetailConseillerQueryHandler.handle({
        idConseiller: 'id-inexistant'
      })

      expect(actual).to.equal(undefined)
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDetailConseillerQuery = {
        idConseiller: utilisateur.id
      }

      // When
      await getDetailConseillerQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(utilisateur.id, utilisateur)
    })
  })
})
