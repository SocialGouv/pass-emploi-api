import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Authentification } from 'src/domain/authentification'
import { Jeune } from 'src/domain/jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  UpdateNotificationTokenCommand,
  UpdateNotificationTokenCommandHandler
} from '../../../src/application/commands/update-notification-token.command.handler'
import { isFailure, isSuccess } from '../../../src/building-blocks/types/result'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('UpdateNotificationTokenCommandHandler', () => {
  let updateNotificationTokenCommandHandler: UpdateNotificationTokenCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let utilisateurRepository: StubbedType<Authentification.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    utilisateurRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    const dateService: StubbedClass<DateService> = stubClass(DateService)
    dateService.now.returns(uneDatetime)
    updateNotificationTokenCommandHandler =
      new UpdateNotificationTokenCommandHandler(
        jeuneRepository,
        utilisateurRepository,
        jeuneAuthorizer,
        dateService
      )
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      it('met à jour le token du jeune', async () => {
        // Given
        const command: UpdateNotificationTokenCommand = {
          idJeune: 'idJeune',
          token: 'leNouveauToken'
        }
        const jeune = unJeune()
        jeuneRepository.get.withArgs('idJeune').resolves(jeune)

        // When
        const result = await updateNotificationTokenCommandHandler.handle(
          command
        )

        // Then
        const jeuneMisAJour: Jeune = {
          ...jeune,
          pushNotificationToken: 'leNouveauToken',
          tokenLastUpdate: uneDatetime
        }
        expect(jeuneRepository.save).to.have.been.calledWithExactly(
          jeuneMisAJour
        )
        expect(isSuccess(result)).to.equal(true)
      })
      it("met à jour la version de l'app", async () => {
        // Given
        const command: UpdateNotificationTokenCommand = {
          idJeune: 'idJeune',
          token: 'leNouveauToken',
          appVersion: '1.0.0'
        }
        const jeune = unJeune()
        jeuneRepository.get.withArgs('idJeune').resolves(jeune)
        utilisateurRepository.updateJeune.resolves()

        // When
        const result = await updateNotificationTokenCommandHandler.handle(
          command
        )

        // Then
        const jeuneMisAJour: Jeune = {
          ...jeune,
          pushNotificationToken: 'leNouveauToken',
          tokenLastUpdate: uneDatetime
        }
        expect(
          utilisateurRepository.updateJeune
        ).to.have.been.calledWithExactly({
          id: jeuneMisAJour.id,
          appVersion: command.appVersion,
          installationId: undefined
        })
        expect(isSuccess(result)).to.equal(true)
      })
      it("met à jour l'installation id de l'app", async () => {
        // Given
        const command: UpdateNotificationTokenCommand = {
          idJeune: 'idJeune',
          token: 'leNouveauToken',
          appVersion: '1.0.0',
          installationId: 'xxx-xx-xxx'
        }
        const jeune = unJeune()
        jeuneRepository.get.withArgs('idJeune').resolves(jeune)
        utilisateurRepository.updateJeune.resolves()

        // When
        const result = await updateNotificationTokenCommandHandler.handle(
          command
        )

        // Then
        const jeuneMisAJour: Jeune = {
          ...jeune,
          pushNotificationToken: 'leNouveauToken',
          tokenLastUpdate: uneDatetime
        }
        expect(
          utilisateurRepository.updateJeune
        ).to.have.been.calledWithExactly({
          id: jeuneMisAJour.id,
          appVersion: command.appVersion,
          installationId: command.installationId
        })
        expect(isSuccess(result)).to.equal(true)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: UpdateNotificationTokenCommand = {
          idJeune: 'idJeune',
          token: 'leNouveauToken'
        }
        jeuneRepository.get.withArgs('idJeune').resolves(undefined)

        // When
        const result = await updateNotificationTokenCommandHandler.handle(
          command
        )

        // Then
        expect(isFailure(result)).to.equal(true)
      })
    })
  })

  describe('authorize', () => {
    it('authorise un jeune ou conseiller à modifier une action', async () => {
      // Given
      const command: UpdateNotificationTokenCommand = {
        idJeune: 'idJeune',
        token: 'leNouveauToken'
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await updateNotificationTokenCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idJeune,
        utilisateur
      )
    })
  })
})
