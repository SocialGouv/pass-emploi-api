import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/create-liste-de-diffusion.command.handler'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { AuthorizeConseillerForJeunes } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { uneDatetime } from '../../fixtures/date.fixture'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { Chat } from '../../../src/domain/chat'

describe('CreateListeDeDiffusionCommandHandler', () => {
  let sandbox: SinonSandbox
  let createListeDeDiffusionCommandHandler: CreateListeDeDiffusionCommandHandler
  let conseillerForJeunesAuthorizer: StubbedClass<AuthorizeConseillerForJeunes>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let listeDeDiffusionFactory: StubbedClass<Conseiller.ListeDeDiffusion.Factory>
  let chatRepository: StubbedType<Chat.Repository>

  beforeEach(() => {
    sandbox = createSandbox()
    conseillerForJeunesAuthorizer = stubClass(AuthorizeConseillerForJeunes)
    listeDeDiffusionRepository = stubInterface(sandbox)
    listeDeDiffusionFactory = stubClass(Conseiller.ListeDeDiffusion.Factory)
    chatRepository = stubInterface(sandbox)

    createListeDeDiffusionCommandHandler =
      new CreateListeDeDiffusionCommandHandler(
        conseillerForJeunesAuthorizer,
        listeDeDiffusionRepository,
        listeDeDiffusionFactory,
        chatRepository
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
        conseillerForJeunesAuthorizer.authorize
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
})
