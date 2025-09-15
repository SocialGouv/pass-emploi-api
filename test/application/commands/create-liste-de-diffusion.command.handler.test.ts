import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/create-liste-de-diffusion.command.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'

describe('CreateListeDeDiffusionCommandHandler', () => {
  let sandbox: SinonSandbox
  let createListeDeDiffusionCommandHandler: CreateListeDeDiffusionCommandHandler
  let conseillerForJeunesAuthorizer: StubbedClass<ConseillerAuthorizer>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let listeDeDiffusionFactory: StubbedClass<Conseiller.ListeDeDiffusion.Factory>
  let chatRepository: StubbedType<Chat.Repository>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    sandbox = createSandbox()
    conseillerForJeunesAuthorizer = stubClass(ConseillerAuthorizer)
    listeDeDiffusionRepository = stubInterface(sandbox)
    listeDeDiffusionFactory = stubClass(Conseiller.ListeDeDiffusion.Factory)
    chatRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    createListeDeDiffusionCommandHandler =
      new CreateListeDeDiffusionCommandHandler(
        conseillerForJeunesAuthorizer,
        listeDeDiffusionRepository,
        listeDeDiffusionFactory,
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
      const idsBeneficiaires: string[] = []
      const command = { idConseiller, titre: '', idsBeneficiaires }

      // When
      createListeDeDiffusionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerForJeunesAuthorizer.autoriserConseillerPourSesJeunes
      ).to.have.been.calledWithExactly(idsBeneficiaires, utilisateur)
    })
  })

  describe('handle', () => {
    let command: CreateListeDeDiffusionCommand
    let expectedListeDeDiffusion: Conseiller.ListeDeDiffusion
    const idConseiller = 'un-id-conseiller'
    const idListe = '8154f0f4-7189-11ed-a1eb-0242ac120002'
    const maintenant = uneDatetime()

    beforeEach(() => {
      // Given
      command = {
        idConseiller,
        titre: 'un-titre',
        idsBeneficiaires: ['un-id-jeune-1', 'un-id-jeune-2']
      }
      expectedListeDeDiffusion = {
        id: idListe,
        idConseiller: command.idConseiller,
        titre: command.titre,
        dateDeCreation: maintenant,
        beneficiaires: [
          {
            id: 'un-id-jeune-1',
            dateAjout: maintenant,
            estDansLePortefeuille: true
          },
          {
            id: 'un-id-jeune-2',
            dateAjout: maintenant,
            estDansLePortefeuille: true
          }
        ]
      }
      listeDeDiffusionFactory.creer.returns(expectedListeDeDiffusion)
    })

    it('crée une liste de diffusion', async () => {
      // When
      const result = await createListeDeDiffusionCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(emptySuccess())
      expect(listeDeDiffusionRepository.save).to.have.been.calledWithExactly(
        expectedListeDeDiffusion
      )
    })
    it('crée une collection firebase', async () => {
      // When
      await createListeDeDiffusionCommandHandler.handle(command)

      // Then
      expect(
        chatRepository.initializeListeDeDiffusionIfNotExists
      ).to.have.been.calledWithExactly(idConseiller, idListe)
    })
  })

  describe('monitor', () => {
    it("créé l'événement idoine", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await createListeDeDiffusionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        Evenement.Code.LISTE_DIFFUSION_CREEE,
        utilisateur
      )
    })
  })
})
