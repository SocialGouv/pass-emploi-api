import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { SinonSandbox, createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import { GetSessionsMiloQueryHandler } from '../../../../src/application/queries/milo/get-sessions.milo.query.handler'
import { ConseillerMiloSansStructure } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ConseillerMilo } from '../../../../src/domain/milo/conseiller.milo'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { unConseillerMilo } from '../../../fixtures/conseiller-milo.fixture'
import { uneSessionConseillerListeDto } from '../../../fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from '../../../fixtures/sessions.fixture'
import { StubbedClass, expect, stubClass } from '../../../utils'

describe('GetSessionsQueryHandler', () => {
  let getSessionsQueryHandler: GetSessionsMiloQueryHandler
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getSessionsQueryHandler = new GetSessionsMiloQueryHandler(
      miloClient,
      conseillerRepository,
      conseillerAuthorizer,
      keycloakClient
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      // When
      const query = {
        idConseiller: 'idConseiller',
        token: 'bearer un-token'
      }
      getSessionsQueryHandler.authorize(query, unUtilisateurConseiller())

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller(),
        true
      )
    })
  })

  describe('handle', () => {
    it("Renvoie une failure quand le conseiller Milo n'existe pas", async () => {
      // Given
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token'
      }
      const idpToken = 'idpToken'
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(query.token)
        .resolves(idpToken)
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(failure(new ConseillerMiloSansStructure(query.idConseiller)))

      // When
      const result = await getSessionsQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new ConseillerMiloSansStructure(query.idConseiller))
      )
    })
    it.skip('Récupère la liste des sessions de sa structure Milo quand le conseiller existe', async () => {
      // Given
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token'
      }
      const idpToken = 'idpToken'
      const conseiller = unConseillerMilo()
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(query.token)
        .resolves(idpToken)
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(success(conseiller))
      miloClient.getSessionsConseiller
        .withArgs(idpToken, conseiller.idStructure)
        .resolves(success(uneSessionConseillerListeDto))

      // When
      const result = await getSessionsQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        success([uneSessionConseillerMiloQueryModel()])
      )
    })
  })
})
