import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  GetConseillerByEmailQuery,
  GetConseillerByEmailQueryHandler
} from '../../../src/application/queries/get-conseiller-by-email.query.handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetConseillerByEmailQueryHandler', () => {
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getConseillerByEmail: GetConseillerByEmailQueryHandler
  let sandbox: SinonSandbox

  beforeEach(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getConseillerByEmail = new GetConseillerByEmailQueryHandler(
      conseillersRepository,
      conseillerAuthorizer
    )
  })

  const structure = Core.Structure.POLE_EMPLOI
  describe('handle', () => {
    it('retourne un conseiller', async () => {
      // Given
      const emailConseiller = 'conseiller@email.fr'
      const getDetailConseillerQuery: GetConseillerByEmailQuery = {
        emailConseiller,
        structure
      }
      const conseillerQueryModel: DetailConseillerQueryModel =
        detailConseillerQueryModel()

      conseillersRepository.getQueryModelByEmailAndStructure
        .withArgs(emailConseiller, structure)
        .resolves(success(conseillerQueryModel))

      // When
      const actual = await getConseillerByEmail.handle(getDetailConseillerQuery)

      // Then
      expect(actual).to.deep.equal(success(conseillerQueryModel))
    })

    it("retourne un échec si le conseiller n'existe pas", async () => {
      // Given
      const emailConseillerInexistant = 'inexistant@email.fr'
      const query: GetConseillerByEmailQuery = {
        emailConseiller: emailConseillerInexistant,
        structure
      }
      const echec = failure(
        new NonTrouveError('conseiller', emailConseillerInexistant)
      )
      conseillersRepository.getQueryModelByEmailAndStructure
        .withArgs(emailConseillerInexistant)
        .resolves(echec)

      // When
      const actual = await getConseillerByEmail.handle(query)

      // Then
      expect(actual).to.equal(echec)
    })
  })

  describe('authorize', () => {
    it('interdit le conseiller non superviseur', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ roles: [] })
      const query: GetConseillerByEmailQuery = {
        emailConseiller: 'whatever@email.fr',
        structure
      }
      conseillerAuthorizer.authorizeSuperviseur.throws(new DroitsInsuffisants())

      // When
      const promise = getConseillerByEmail.authorize(query, utilisateur)

      // Then
      expect(promise).to.be.rejectedWith(DroitsInsuffisants)
    })
  })
})
