import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { EvenementService } from 'src/domain/evenement'
import { Mail } from 'src/domain/mail'
import { unMailDto } from 'test/fixtures/mail.fixture'
import {
  DeleteJeuneCommand,
  DeleteJeuneCommandHandler
} from '../../../src/application/commands/delete-jeune.command.handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  Failure,
  isFailure,
  Result
} from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Jeune } from '../../../src/domain/jeune'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune,
  unUtilisateurSupport
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('DeleteJeuneCommandHandler', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let commandHandler: DeleteJeuneCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let mailFactory: StubbedClass<Mail.Factory>
  let mailClient: StubbedType<Mail.Service>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let conseiller: Conseiller
  let jeune: Jeune
  let command: DeleteJeuneCommand
  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    authentificationRepository = stubInterface(sandbox)
    mailClient = stubInterface(sandbox)
    mailFactory = stubClass(Mail.Factory)
    commandHandler = new DeleteJeuneCommandHandler(
      jeuneRepository,
      chatRepository,
      authentificationRepository,
      evenementService,
      mailClient,
      mailFactory
    )

    conseiller = unConseiller()
    jeune = unJeune({
      isActivated: false,
      conseiller
    })
    command = { idJeune: 'ABCDE' }
    jeuneRepository.get.withArgs('ABCDE').resolves(jeune)
    mailFactory.creerMailSuppressionJeune.returns(unMailDto())
  })

  describe('.authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      const promise = commandHandler.authorize(command, utilisateur)

      // Then
      await expect(promise).not.to.be.rejected()
    })

    it('autorise le support', async () => {
      // Given
      const utilisateur = unUtilisateurSupport()

      // When
      const promise = commandHandler.authorize(command, utilisateur)

      // Then
      expect(promise).not.to.be.rejected()
    })

    it('interdit un autre jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune({ id: 'un-autre-id' })

      // When
      let erreur
      try {
        await commandHandler.authorize(command, utilisateur)
      } catch (e) {
        erreur = e
      }
      // Then
      expect(erreur).to.be.an.instanceof(DroitsInsuffisants)
    })

    it('interdit un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      // When
      let erreur
      try {
        await commandHandler.authorize(command, utilisateur)
      } catch (e) {
        erreur = e
      }
      // Then
      expect(erreur).to.be.an.instanceof(DroitsInsuffisants)
    })
  })

  describe('.handle', () => {
    it("renvoie une erreur si le jeune n'existe pas", async () => {
      // When
      const result = await commandHandler.handle({
        ...command,
        idJeune: 'inexistant'
      })

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceof(NonTrouveError)
    })

    describe('suppression du jeune', () => {
      let result: Result
      beforeEach(async () => {
        // When
        result = await commandHandler.handle(command)
      })

      it('supprime le jeune', () => {
        // Then
        expect(jeuneRepository.supprimer).to.have.been.calledWith(
          command.idJeune
        )
      })

      it('supprime le chat', () => {
        expect(chatRepository.supprimerChat).to.have.been.calledWith(
          command.idJeune
        )
      })

      it('envoie un email au conseiller', () => {
        expect(mailFactory.creerMailSuppressionJeune).to.have.been.calledWith(
          jeune
        )
        expect(mailClient.envoyer).to.have.been.calledWith(unMailDto())
      })

      it('renvoie un succès', () => {
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
