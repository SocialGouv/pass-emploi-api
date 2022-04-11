import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  GetDetailJeuneQuery,
  GetDetailJeuneQueryHandler
} from '../../../src/application/queries/get-detail-jeune.query.handler'
import { DetailJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-models'
import { Jeune } from '../../../src/domain/jeune'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDetailJeuneQueryHandler', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getDetailJeuneQueryHandler = new GetDetailJeuneQueryHandler(
      jeuneRepository,
      conseillerForJeuneAuthorizer,
      jeuneAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne un jeune', async () => {
      // Given
      const idJeune = 'idJeune'
      const getDetailJeuneQuery: GetDetailJeuneQuery = {
        idJeune
      }
      const detailJeuneQueryModel: DetailJeuneQueryModel =
        unDetailJeuneQueryModel()

      jeuneRepository.getDetailJeuneQueryModelById
        .withArgs(idJeune)
        .resolves(detailJeuneQueryModel)

      // When
      const actual = await getDetailJeuneQueryHandler.handle(
        getDetailJeuneQuery
      )

      // Then
      expect(actual).to.deep.equal(detailJeuneQueryModel)
    })

    it("retourne undefined si le jeune n'existe pas", async () => {
      // Given
      const idJeuneInexistant = 'idJeuneInexistant'
      const query: GetDetailJeuneQuery = {
        idJeune: idJeuneInexistant
      }
      jeuneRepository.getDetailJeuneQueryModelById
        .withArgs(idJeuneInexistant)
        .resolves()

      // When
      const actual = await getDetailJeuneQueryHandler.handle(query)

      // Then
      expect(actual).to.equal(undefined)
    })
  })

  describe('authorize', () => {
    it("appelle l'authorizer pour le conseiller", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDetailJeuneQuery = {
        idJeune: utilisateur.id
      }

      // When
      await getDetailJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerForJeuneAuthorizer.authorize
      ).to.have.been.calledWithExactly(utilisateur.id, utilisateur)
    })
    it("appelle l'authorizer pour le jeune", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query: GetDetailJeuneQuery = {
        idJeune: utilisateur.id
      }

      // When
      await jeuneAuthorizer.authorize(query.idJeune, utilisateur)

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        utilisateur.id,
        utilisateur
      )
    })
  })
})
