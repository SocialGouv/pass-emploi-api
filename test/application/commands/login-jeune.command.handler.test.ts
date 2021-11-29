import { Jeune } from '../../../src/domain/jeune'
import { createSandbox, expect } from '../../utils'
import { Chat } from '../../../src/domain/chat'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  LoginJeuneCommand,
  LoginJeuneCommandHandler
} from '../../../src/application/commands/login-jeune.command.handler'
import { unJeune } from '../../fixtures/jeune.fixture'

describe('LoginJeuneCommandHandler', () => {
  describe('execute', () => {
    let loginJeuneCommandHandler: LoginJeuneCommandHandler
    const sandbox: SinonSandbox = createSandbox()
    const jeune = unJeune()
    const jeuneRepository: StubbedType<Jeune.Repository> =
      stubInterface(sandbox)
    let chatRepository: StubbedType<Chat.Repository> = stubInterface(sandbox)
    before(async () => {
      loginJeuneCommandHandler = new LoginJeuneCommandHandler(
        jeuneRepository,
        chatRepository
      )
    })
    describe('quand le jeune existe', () => {
      it('permet au jeune de se connecter et initialise le chat si besoin', async () => {
        // Given
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
        const command: LoginJeuneCommand = {
          idJeune: jeune.id
        }

        // When
        const result = await loginJeuneCommandHandler.execute(command)

        // Then
        expect(result).to.deep.equal(jeune)
        expect(
          chatRepository.initializeChatIfNotExists
        ).to.have.been.calledWith(jeune.id, jeune.conseiller.id)
      })
    })
    describe('quand le jeune n"existe pas', () => {
      it('ne renvoie rien', async () => {
        // Given
        chatRepository = stubInterface(sandbox)
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)
        const command: LoginJeuneCommand = {
          idJeune: jeune.id
        }

        // When
        const result = await loginJeuneCommandHandler.execute(command)

        // Then
        expect(result).to.deep.equal(undefined)
        expect(
          chatRepository.initializeChatIfNotExists
        ).not.to.have.been.calledWith(jeune.id, jeune.conseiller.id)
      })
    })
  })
})
