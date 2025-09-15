import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  DeleteJeuneInactifCommand,
  DeleteJeuneInactifCommandHandler
} from '../../../src/application/commands/delete-jeune-inactif.command.handler'
import {
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  Failure,
  Result,
  emptySuccess,
  isFailure
} from '../../../src/building-blocks/types/result'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'

describe('DeleteJeuneInactifCommandHandler', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let commandHandler: DeleteJeuneInactifCommandHandler
  let conseiller: Conseiller
  let jeune: Jeune
  let command: DeleteJeuneInactifCommand
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    commandHandler = new DeleteJeuneInactifCommandHandler(
      conseillerRepository,
      jeuneRepository,
      chatRepository,
      conseillerAuthorizer
    )

    conseiller = unConseiller()
    jeune = unJeune({ isActivated: false })
    command = { idConseiller: 'id-conseiller', idJeune: 'id-jeune' }
    conseillerRepository.get.withArgs('id-conseiller').resolves(conseiller)
    jeuneRepository.get.withArgs('id-jeune').resolves(jeune)
  })

  describe('authorize', () => {
    it('autorise un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      // When
      await commandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserToutConseiller
      ).to.have.been.calledOnceWithExactly(utilisateur)
    })
  })

  describe('handle', () => {
    it("renvoie une erreur si le conseiller n'existe pas", async () => {
      // When
      const result = await commandHandler.handle({
        ...command,
        idConseiller: 'inexistant'
      })

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceof(NonTrouveError)
    })

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

    it("empêche la suppression du jeune d'un autre conseiller", async () => {
      // Given
      jeuneRepository.get
        .withArgs('id-jeune')
        .resolves(
          unJeune({ conseiller: unConseillerDuJeune({ id: 'un-autre' }) })
        )

      // When
      const result = await commandHandler.handle(command)

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceof(
        JeuneNonLieAuConseillerError
      )
    })

    it("empêche la suppression d'un jeune qui s'est déja connecté", async () => {
      // Given
      jeuneRepository.get
        .withArgs('id-jeune')
        .resolves(
          unJeune({ isActivated: true, conseiller: unConseillerDuJeune() })
        )

      // When
      const result = await commandHandler.handle(command)

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceof(
        JeunePasInactifError
      )
    })

    describe('suppression du jeune', () => {
      let result: Result
      beforeEach(async () => {
        // When
        result = await commandHandler.handle(command)
      })

      it('supprime le jeune', () => {
        // Then
        expect(jeuneRepository.supprimer).to.have.been.calledWith('id-jeune')
      })

      it('supprime le chat', () => {
        expect(chatRepository.supprimerChat).to.have.been.calledWith('id-jeune')
      })

      it('renvoie un succès', () => {
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
