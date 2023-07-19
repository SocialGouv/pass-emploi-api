import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerMiloQueryModel,
  uneSessionMilo
} from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'

describe('GetDetailSessionConseillerMiloQueryHandler', () => {
  let getDetailSessionMiloQueryHandler: GetDetailSessionConseillerMiloQueryHandler
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let sessionRepository: StubbedType<SessionMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()

    keycloakClient = stubClass(KeycloakClient)
    conseillerRepository = stubInterface(sandbox)
    sessionRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getDetailSessionMiloQueryHandler =
      new GetDetailSessionConseillerMiloQueryHandler(
        conseillerRepository,
        sessionRepository,
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
    const query = {
      idSession: 'idSession-1',
      idConseiller: 'idConseiller-1',
      token: 'bearer un-token'
    }
    it("renvoie une failure quand le conseiller Milo n'existe pas", async () => {
      // Given
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

    it('récupère le détail d’une session', async () => {
      // Given
      const tokenMilo = 'token-milo'
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(success(unConseillerMilo()))
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(query.token)
        .resolves(tokenMilo)
      sessionRepository.getForConseiller.resolves(success(uneSessionMilo()))

      // When
      const result = await getDetailSessionMiloQueryHandler.handle(query)

      // Then
      expect(
        sessionRepository.getForConseiller
      ).to.have.been.calledOnceWithExactly(
        query.idSession,
        {
          id: '1',
          timezone: 'America/Cayenne'
        },
        tokenMilo
      )
      expect(result).to.deep.equal(
        success({
          ...unDetailSessionConseillerMiloQueryModel,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              nom: 'Weasley',
              prenom: 'Ronald',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            },
            {
              idJeune: 'id-harry',
              nom: 'Potter',
              prenom: 'Harry',
              statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
            }
          ]
        })
      )
    })
  })
})
