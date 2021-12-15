import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  GetDetailConseillerQuery,
  GetDetailConseillerQueryHandler
} from '../../../src/application/queries/get-detail-conseiller.query.handler'
import { Conseiller } from '../../../src/domain/conseiller'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDetailConseillerQueryHandler', () => {
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getDetailConseillerQueryHandler = new GetDetailConseillerQueryHandler(
      conseillersRepository,
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne un conseiller', async () => {
      // Given
      const idConseiller = 'idConseiller'
      const getDetailConseillerQuery: GetDetailConseillerQuery = {
        idConseiller
      }
      const conseillerEtSesJeunesQueryModel: DetailConseillerQueryModel =
        detailConseillerQueryModel()

      conseillersRepository.getQueryModelById
        .withArgs(idConseiller)
        .resolves(conseillerEtSesJeunesQueryModel)

      // When
      const actual = await getDetailConseillerQueryHandler.handle(
        getDetailConseillerQuery
      )

      // Then
      expect(actual).to.deep.equal(conseillerEtSesJeunesQueryModel)
    })

    it("retourne undefined si le conseiller n'existe pas", async () => {
      // Given
      const idConseillerInexistante = 'idConseillerInexistant'
      const query: GetDetailConseillerQuery = {
        idConseiller: idConseillerInexistante
      }
      conseillersRepository.getQueryModelById
        .withArgs(idConseillerInexistante)
        .resolves()

      // When
      const actual = await getDetailConseillerQueryHandler.handle(query)

      // Then
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
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        utilisateur.id,
        utilisateur
      )
    })
  })
})
