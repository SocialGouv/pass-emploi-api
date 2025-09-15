import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import { ListeDeDiffusionAuthorizer } from '../../../src/application/authorizers/liste-de-diffusion-authorizer'
import { DeleteListeDeDiffusionCommandHandler } from '../../../src/application/commands/delete-liste-de-diffusion.command.handler'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('DeleteListeDeDiffusionCommandHandler', () => {
  let sandbox: SinonSandbox
  let deleteListeDeDiffusionCommandHandler: DeleteListeDeDiffusionCommandHandler
  let listeDeDiffusionAuthorizer: StubbedClass<ListeDeDiffusionAuthorizer>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    sandbox = createSandbox()
    listeDeDiffusionAuthorizer = stubClass(ListeDeDiffusionAuthorizer)
    listeDeDiffusionRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    deleteListeDeDiffusionCommandHandler =
      new DeleteListeDeDiffusionCommandHandler(
        listeDeDiffusionAuthorizer,
        listeDeDiffusionRepository,
        chatRepository,
        evenementService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise le conseiller', () => {
      // Given
      const idConseiller = 'un-id-conseiller'
      const utilisateur = unUtilisateurConseiller({ id: idConseiller })

      const listeDeDiffusion = uneListeDeDiffusion({ idConseiller })
      listeDeDiffusionRepository.get.resolves(listeDeDiffusion)

      // When
      const command = { idListeDeDiffusion: listeDeDiffusion.id }
      deleteListeDeDiffusionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        listeDeDiffusionAuthorizer.autoriserConseillerPourSaListeDeDiffusion
      ).to.have.been.calledWithExactly(listeDeDiffusion.id, utilisateur)
    })
  })

  describe('handle', () => {
    const idListe = '8154f0f4-7189-11ed-a1eb-0242ac120002'

    it('supprime la liste de diffusion', async () => {
      // When
      await deleteListeDeDiffusionCommandHandler.handle({
        idListeDeDiffusion: idListe
      })

      // Then
      expect(listeDeDiffusionRepository.delete).to.have.been.calledWithExactly(
        idListe
      )
    })

    it('supprime la collection firebase', async () => {
      // When
      await deleteListeDeDiffusionCommandHandler.handle({
        idListeDeDiffusion: idListe
      })

      // Then
      expect(
        chatRepository.supprimerListeDeDiffusion
      ).to.have.been.calledWithExactly(idListe)
    })
  })

  describe('monitor', () => {
    it("créé l'événement idoine", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await deleteListeDeDiffusionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        Evenement.Code.LISTE_DIFFUSION_SUPPRIMEE,
        utilisateur
      )
    })
  })
})
