import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { createSandbox, expect, StubbedClass, stubClass } from 'test/utils'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import { Authentification } from 'src/domain/authentification'
import Utilisateur = Authentification.Utilisateur
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { SinonSandbox } from 'sinon'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import {
  ConseillerMiloSansStructure,
  ErreurHttp
} from 'src/building-blocks/types/domain-error'
import { unDetailSessionConseillerDto } from 'test/fixtures/milo-dto.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'

describe('UpdateSessionMiloCommandHandler', () => {
  let updateSessionMiloCommandHandler: UpdateSessionMiloCommandHandler
  let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
  let sessionMiloRepository: StubbedType<SessionMilo.Repository>
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let sessionMiloFactory: StubbedClass<SessionMilo.Factory>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  const conseiller = unConseillerMilo()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    conseillerMiloRepository = stubInterface(sandbox)
    sessionMiloRepository = stubInterface(sandbox)
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    sessionMiloFactory = stubClass(SessionMilo.Factory)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    updateSessionMiloCommandHandler = new UpdateSessionMiloCommandHandler(
      conseillerMiloRepository,
      sessionMiloRepository,
      miloClient,
      keycloakClient,
      sessionMiloFactory,
      conseillerAuthorizer
    )
  })

  describe('handle', () => {
    const command: UpdateSessionMiloCommand = {
      estVisible: true,
      idSession: 'idSession',
      idConseiller: conseiller.id,
      token: 'token'
    }

    it('n’autorise pas un conseiller sans structure', async () => {
      // Given
      const conseillerMiloSansStructure = new ConseillerMiloSansStructure(
        command.idConseiller
      )
      conseillerMiloRepository.get
        .withArgs(command.idConseiller)
        .resolves(failure(conseillerMiloSansStructure))

      // When
      const result = await updateSessionMiloCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(failure(conseillerMiloSansStructure))
    })

    it('n’autorise pas un conseiller qui n’a pas accès à la session', async () => {
      // Given
      const idpToken = 'idpToken'
      conseillerMiloRepository.get
        .withArgs(command.idConseiller)
        .resolves(success(conseiller))
      const erreurHttp = new ErreurHttp('', 404)
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(command.token)
        .resolves(idpToken)
      miloClient.getDetailSessionConseiller
        .withArgs(idpToken, command.idSession)
        .resolves(failure(erreurHttp))

      // When
      const result = await updateSessionMiloCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(failure(erreurHttp))
    })

    it('met à jour une session si le conseiller y a accès', async () => {
      const idpToken = 'idpToken'
      // Given
      conseillerMiloRepository.get
        .withArgs(command.idConseiller)
        .resolves(success(conseiller))
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(command.token)
        .resolves(idpToken)
      miloClient.getDetailSessionConseiller
        .withArgs(idpToken, command.idSession)
        .resolves(success(unDetailSessionConseillerDto))

      const session: SessionMilo = {
        id: 'id-session',
        estVisible: true,
        idStructureMilo: 'id-structure',
        dateModification: uneDatetime()
      }
      sessionMiloFactory.mettreAJour
        .withArgs(
          unDetailSessionConseillerDto.session.id.toString(),
          command.estVisible,
          conseiller.structure.id
        )
        .returns(session)

      // When
      const result = await updateSessionMiloCommandHandler.handle(command)

      // Then
      expect(sessionMiloRepository.save).to.have.been.calledWithExactly(session)
      expect(result).to.deep.equal(emptySuccess())
    })
  })

  describe('authorize', () => {
    it('authorize le conseiller', async () => {
      // Given
      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idSession: 'idSession',
        idConseiller: conseiller.id,
        token: 'token'
      }
      const utilisateur: Utilisateur = unUtilisateurConseiller()

      // When
      await updateSessionMiloCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(command.idConseiller, utilisateur, true)
    })
  })
})
