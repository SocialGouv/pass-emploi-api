import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { emptySuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from 'test/utils'
import {
  EnvoyerEmailActivationCommand,
  EnvoyerEmailActivationCommandHandler
} from '../../../../src/application/commands/milo/envoyer-email-activation.command.handler'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { unJeune } from '../../../fixtures/jeune.fixture'
import Utilisateur = Authentification.Utilisateur

describe('EnvoyerEmailActivationCommandHandler', () => {
  let envoyerEmailActivationCommandHandler: EnvoyerEmailActivationCommandHandler
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let oidcClient: StubbedClass<OidcClient>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let miloClient: StubbedClass<MiloClient>

  const utilisateur: Utilisateur = unUtilisateurConseiller()
  const idpToken = 'ok'
  const jeune = unJeune()
  const command: EnvoyerEmailActivationCommand = {
    idJeune: jeune.id,
    idConseiller: 'con',
    accessToken: 'token'
  }

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    oidcClient = stubClass(OidcClient)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    miloClient = stubClass(MiloClient)
    oidcClient.exchangeTokenConseillerMilo.resolves(idpToken)
    envoyerEmailActivationCommandHandler =
      new EnvoyerEmailActivationCommandHandler(
        conseillerRepository,
        jeuneRepository,
        conseillerAuthorizer,
        miloClient,
        oidcClient
      )
  })

  describe('handle', () => {
    it('envoie le mail', async () => {
      // Given
      conseillerRepository.get
        .withArgs(command.idConseiller)
        .resolves(unConseillerMilo())
      jeuneRepository.get.withArgs(command.idJeune).resolves(jeune)
      miloClient.envoyerEmailActivation.resolves(emptySuccess())

      // When
      const result = await envoyerEmailActivationCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(emptySuccess())
      expect(
        miloClient.envoyerEmailActivation
      ).to.have.been.calledOnceWithExactly(idpToken, jeune.email)
    })
  })

  describe('authorize', () => {
    it('authorize le conseiller pour son jeune', async () => {
      // When
      await envoyerEmailActivationCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseillerPourSonJeune
      ).to.have.been.calledWithExactly(
        command.idConseiller,
        command.idJeune,
        utilisateur,
        true
      )
    })
  })
})
