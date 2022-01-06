import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { EvenementService } from 'src/domain/evenement'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../../src/application/commands/create-action.command.handler'
import { failure, success } from '../../../src/building-blocks/types/result'
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
  let jeune: Required<Omit<Jeune, 'tokenLastUpdate'>>
  let actionRepository: StubbedType<Action.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
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
    notificationRepository = stubInterface(sandbox)
    jeuneRepository.get.withArgs(action.idJeune).resolves(jeune)
    actionFactory = stubClass(Action.Factory)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    evenementService = stubClass(EvenementService)

    createActionCommandHandler = new CreateActionCommandHandler(
      actionRepository,
      jeuneRepository,
      notificationRepository,
      actionFactory,
      jeuneAuthorizer,
      conseillerAuthorizer,
      evenementService
    )
  })
  describe('handle', () => {
    it('créée une action', async () => {
      // Given
      actionFactory.buildAction.returns(success(action))
      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: action.contenu,
        idCreateur: action.idCreateur,
        typeCreateur: action.typeCreateur,
        statut: action.statut,
        commentaire: action.commentaire
      }

      // When
      const result = await createActionCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(success(action.id))
      expect(actionRepository.save).to.have.been.calledWithExactly(action)
      expect(notificationRepository.send).to.have.been.calledWith(
        Notification.createNouvelleAction(
          jeune.pushNotificationToken,
          action.id
        )
      )
    })

    describe('quand le statut est incorrect', () => {
      it('remonte la failure', async () => {
        // Given
        const statutIncorrect = 'STATUT_INCORRECT'
        const echec = failure(new Action.StatutInvalide(statutIncorrect))
        actionFactory.buildAction.returns(echec)
        const command: CreateActionCommand = {
          idJeune: action.idJeune,
          contenu: action.contenu,
          idCreateur: action.idCreateur,
          typeCreateur: action.typeCreateur,
          statut: statutIncorrect as Action.Statut,
          commentaire: action.commentaire
        }

        // When
        const result = await createActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(echec)
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
          idCreateur: action.idCreateur,
          typeCreateur: action.typeCreateur,
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
          typeCreateur: action.typeCreateur,
          statut: action.statut,
          commentaire: action.commentaire
        }

        // When
        await createActionCommandHandler.authorize(command, utilisateur)

        // Then
        expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
          action.idCreateur,
          utilisateur,
          action.idJeune
        )
      })
    })
  })
})
