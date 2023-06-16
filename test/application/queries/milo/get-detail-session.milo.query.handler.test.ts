import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { SinonSandbox, createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import { ConseillerMiloSansStructure } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ConseillerMilo } from '../../../../src/domain/milo/conseiller.milo'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { unConseillerMilo } from '../../../fixtures/conseiller-milo.fixture'
import { unDetailSessionConseillerDto } from '../../../fixtures/milo-dto.fixture'
import { StubbedClass, expect, stubClass } from '../../../utils'
import { GetDetailSessionMiloQueryHandler } from '../../../../src/application/queries/milo/get-detail-session.milo.query.handler'
import { unDetailSessionConseillerMiloQueryModel } from '../../../fixtures/sessions.fixture'

describe('GetDetailSessionMiloQueryHandler', () => {
  let getDetailSessionMiloQueryHandler: GetDetailSessionMiloQueryHandler
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
    getDetailSessionMiloQueryHandler = new GetDetailSessionMiloQueryHandler(
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
        idSession: 'idSession',
        idConseiller: 'idConseiller',
        token: 'bearer un-token'
      }
      getDetailSessionMiloQueryHandler.authorize(
        query,
        unUtilisateurConseiller()
      )

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
    it("renvoie une failure quand le conseiller Milo n'existe pas", async () => {
      // Given
      const query = {
        idSession: 'idSession-1',
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token'
      }
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(failure(new ConseillerMiloSansStructure(query.idConseiller)))

      // When
      const result = await getDetailSessionMiloQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new ConseillerMiloSansStructure(query.idConseiller))
      )
    })
    it("récupère le detail d'une session", async () => {
      // Given
      const query = {
        idSession: 'idSession-1',
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
      miloClient.getDetailSessionConseiller
        .withArgs(idpToken, query.idSession)
        .resolves(success(unDetailSessionConseillerDto))

      // When
      const result = await getDetailSessionMiloQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        success(unDetailSessionConseillerMiloQueryModel())
      )
    })
  })
})
