import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Mail } from 'src/domain/mail'
import { unMailDto } from 'test/fixtures/mail.fixture'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { SupportAuthorizer } from '../../../src/application/authorizers/support-authorizer'
import {
  DeleteJeuneCommand,
  DeleteJeuneCommandHandler
} from '../../../src/application/commands/delete-jeune.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  Failure,
  Result,
  emptySuccess,
  isFailure
} from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Chat } from '../../../src/domain/chat'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  unUtilisateurJeune,
  unUtilisateurSupport
} from '../../fixtures/authentification.fixture'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'

describe('DeleteJeuneCommandHandler', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let deleteJeuneCommandHandler: DeleteJeuneCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let mailFactory: StubbedClass<Mail.Factory>
  let mailService: StubbedType<Mail.Service>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let supportAuthorizer: StubbedClass<SupportAuthorizer>
  let jeune: Jeune
  let command: DeleteJeuneCommand
  const sandbox = createSandbox()
  beforeEach(() => {
    jeuneRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    supportAuthorizer = stubClass(SupportAuthorizer)
    authentificationRepository = stubInterface(sandbox)
    mailService = stubInterface(sandbox)
    mailFactory = stubClass(Mail.Factory)
    deleteJeuneCommandHandler = new DeleteJeuneCommandHandler(
      jeuneRepository,
      chatRepository,
      authentificationRepository,
      evenementService,
      mailService,
      mailFactory,
      jeuneAuthorizer,
      supportAuthorizer
    )

    mailFactory.creerMailSuppressionJeune.returns(unMailDto())
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    beforeEach(async () => {
      //Given
      jeune = unJeune({
        isActivated: false,
        conseiller: unConseillerDuJeune()
      })
      command = { idJeune: 'ABCDE' }
      jeuneRepository.get.withArgs('ABCDE').resolves(jeune)
    })

    it('autorise le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await deleteJeuneCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly(command.idJeune, utilisateur)
    })

    it('autorise le support', async () => {
      // Given
      const utilisateur = unUtilisateurSupport()

      // When
      await deleteJeuneCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        supportAuthorizer.autoriserSupport
      ).to.have.been.calledOnceWithExactly(utilisateur)
    })
  })

  describe('handle', () => {
    it("renvoie une erreur si le jeune n'existe pas", async () => {
      // When
      const result = await deleteJeuneCommandHandler.handle({
        ...command,
        idJeune: 'inexistant'
      })

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceof(NonTrouveError)
    })

    describe('suppression du jeune avec conseiller', () => {
      let result: Result
      beforeEach(async () => {
        //Given
        jeune = unJeune({
          isActivated: false,
          conseiller: unConseillerDuJeune()
        })
        command = { idJeune: 'ABCDE' }
        jeuneRepository.get.withArgs('ABCDE').resolves(jeune)
        // When
        result = await deleteJeuneCommandHandler.handle(command)
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
        expect(mailService.envoyer).to.have.been.calledWith(unMailDto())
      })

      it('renvoie un succès', () => {
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('suppression du jeune avec conseiller sans email', () => {
      let result: Result
      beforeEach(async () => {
        //Given
        jeune = unJeune({
          isActivated: false,
          conseiller: {
            ...unConseillerDuJeune(),
            email: undefined
          }
        })
        command = { idJeune: 'ABCDE' }
        jeuneRepository.get.withArgs('ABCDE').resolves(jeune)
        // When
        result = await deleteJeuneCommandHandler.handle(command)
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

      it("n'envoie pas un email au conseiller", () => {
        expect(mailService.envoyer).to.not.have.been.called()
      })

      it('renvoie un succès', () => {
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('suppression du jeune sans conseiller', () => {
      let result: Result
      beforeEach(async () => {
        //Given
        jeune = unJeune({
          isActivated: false,
          conseiller: undefined
        })
        command = { idJeune: 'ABCDE' }
        jeuneRepository.get.withArgs('ABCDE').resolves(jeune)
        // When
        result = await deleteJeuneCommandHandler.handle(command)
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

      it("n'envoie pas un email au conseiller", () => {
        expect(mailService.envoyer).to.not.have.been.called()
      })

      it('renvoie un succès', () => {
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    it("créé l'événement idoine", () => {
      // When
      deleteJeuneCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.COMPTE_SUPPRIME,
        utilisateur
      )
    })
  })
})
