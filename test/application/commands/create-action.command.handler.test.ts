import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { EvenementService } from 'src/domain/evenement'
import { stubClassSandbox } from 'test/utils/types'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../../src/application/commands/create-action.command.handler'
import { success } from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { Authentification } from '../../../src/domain/authentification'
import { Jeune } from '../../../src/domain/jeune'
import { Notification } from '../../../src/domain/notification'
import { uneAction } from '../../fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('CreateActionCommandHandler', () => {
  let action: Action
  let jeune: Required<Omit<Jeune, 'tokenLastUpdate' | 'idDossier'>>
  let actionRepository: StubbedType<Action.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let actionFactory: StubbedClass<Action.Factory>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let createActionCommandHandler: CreateActionCommandHandler
  let evenementService: StubbedClass<EvenementService>

  beforeEach(async () => {
    action = uneAction()
    jeune = unJeune()
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    const jeuneRepository: StubbedType<Jeune.Repository> =
      stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierNouvelleAction.resolves()
    jeuneRepository.get.withArgs(action.idJeune).resolves(jeune)
    actionFactory = stubClass(Action.Factory)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    evenementService = stubClass(EvenementService)

    createActionCommandHandler = new CreateActionCommandHandler(
      actionRepository,
      jeuneRepository,
      notificationService,
      actionFactory,
      jeuneAuthorizer,
      conseillerAuthorizer,
      evenementService
    )
  })
  describe('handle', () => {
    describe("quand c'est un jeune", () => {
      it("crée une action et n'envoie pas de notification", async () => {
        // Given
        actionFactory.buildAction.returns(success(action))
        const command: CreateActionCommand = {
          idJeune: action.idJeune,
          contenu: action.contenu,
          idCreateur: action.id,
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: action.statut,
          commentaire: action.commentaire
        }

        // When
        const result = await createActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success(action.id))
        expect(actionRepository.save).to.have.been.calledWithExactly(action)
        expect(notificationService.notifierNouvelleAction).to.have.callCount(0)
      })
    })
    describe("quand c'est un conseiller", () => {
      it('crée une action et envoie une notification au jeune', async () => {
        // Given
        actionFactory.buildAction.returns(success(action))
        const command: CreateActionCommand = {
          idJeune: action.idJeune,
          contenu: action.contenu,
          idCreateur: action.id,
          typeCreateur: Action.TypeCreateur.CONSEILLER,
          statut: action.statut,
          commentaire: action.commentaire
        }

        // When
        const result = await createActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success(action.id))
        expect(actionRepository.save).to.have.been.calledWithExactly(action)
        expect(
          notificationService.notifierNouvelleAction
        ).to.have.been.calledOnceWithExactly(jeune, action)
      })
    })
  })

  describe('authorize', () => {
    describe("quand c'est un jeune", () => {
      it("autorise le jeune à créer l'action", async () => {
        // Given
        const command: CreateActionCommand = {
          idJeune: action.idJeune,
          contenu: action.contenu,
          idCreateur: action.id,
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: action.statut,
          commentaire: action.commentaire
        }

        const utilisateur: Authentification.Utilisateur = unUtilisateurJeune()

        // When
        await createActionCommandHandler.authorize(command, utilisateur)

        // Then
        expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
          action.idJeune,
          utilisateur
        )
      })
    })
    describe("quand c'est un conseiller", () => {
      it("autorise le conseiller à créer l'action", async () => {
        // Given
        const utilisateur: Authentification.Utilisateur =
          unUtilisateurConseiller()

        const command: CreateActionCommand = {
          idJeune: action.idJeune,
          contenu: action.contenu,
          idCreateur: utilisateur.id,
          typeCreateur: Action.TypeCreateur.CONSEILLER,
          statut: action.statut,
          commentaire: action.commentaire
        }

        // When
        await createActionCommandHandler.authorize(command, utilisateur)

        // Then
        expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
          command.idCreateur,
          utilisateur,
          action.idJeune
        )
      })
    })
  })
})
