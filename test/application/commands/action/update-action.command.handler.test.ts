import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { ActionAuthorizer } from '../../../../src/application/authorizers/action-authorizer'
import { NonTrouveError } from '../../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../../src/building-blocks/types/result'
import { Action } from '../../../../src/domain/action/action'
import { uneAction } from '../../../fixtures/action.fixture'
import {
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import {
  UpdateActionCommand,
  UpdateActionCommandHandler
} from 'src/application/commands/action/update-action.command.handler'
import { DateTime } from 'luxon'
import { Qualification } from 'src/domain/action/qualification'

describe('UpdateActionCommandHandler', () => {
  let actionRepository: StubbedType<Action.Repository>
  let updateActionCommandHandler: UpdateActionCommandHandler
  let actionFactory: StubbedClass<Action.Factory>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionFactory = stubClass(Action.Factory)
    actionAuthorizer = stubClass(ActionAuthorizer)
    evenementService = stubClass(EvenementService)
    updateActionCommandHandler = new UpdateActionCommandHandler(
      actionRepository,
      actionFactory,
      actionAuthorizer,
      evenementService
    )
  })

  describe('getEntity', () => {
    it("renvoie l'action quand elle existe", async () => {
      // Given
      const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
      const actionOrigine = uneAction({
        id: idAction,
        statut: Action.Statut.PAS_COMMENCEE
      })
      const command: UpdateActionCommand = {
        idAction: idAction,
        statut: Action.Statut.EN_COURS,
        contenu: "Nouveau contenu de l'action",
        description: "Nouvelle description de l'action",
        dateEcheance: DateTime.fromISO('2023-12-27')
      }
      actionRepository.get.withArgs(idAction).resolves(actionOrigine)
      const entity = await updateActionCommandHandler.getAggregate(command)
      expect(entity).to.deep.equal(actionOrigine)
    })
    it("renvoie undefined quand l'action n'existe pas", async () => {
      // Given
      const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
      const command: UpdateActionCommand = {
        idAction: idAction,
        statut: Action.Statut.EN_COURS,
        contenu: "Nouveau contenu de l'action",
        description: "Nouvelle description de l'action",
        dateEcheance: DateTime.fromISO('2023-12-27')
      }
      actionRepository.get.withArgs(idAction).resolves(undefined)
      const entity = await updateActionCommandHandler.getAggregate(command)
      expect(entity).to.deep.equal(undefined)
    })
  })

  describe('handle', () => {
    describe('Quand l’action existe', () => {
      it("modifie l'action", async () => {
        // Given
        const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
        const actionOrigine = uneAction({
          id: idAction,
          statut: Action.Statut.PAS_COMMENCEE
        })
        const actionModifiee = uneAction({
          id: idAction,
          statut: Action.Statut.TERMINEE,
          contenu: "Nouveau contenu de l'action",
          description: "Nouvelle description de l'action",
          dateEcheance: DateTime.fromISO('2023-12-27'),
          dateFinReelle: DateTime.fromISO('2024-01-02')
        })
        actionRepository.get.withArgs(idAction).resolves(actionOrigine)
        actionFactory.updateAction.returns(success(actionModifiee))

        // When
        const command: UpdateActionCommand = {
          idAction: idAction,
          statut: Action.Statut.TERMINEE,
          contenu: "Nouveau contenu de l'action",
          description: "Nouvelle description de l'action",
          dateEcheance: DateTime.fromISO('2023-12-27'),
          dateFinReelle: DateTime.fromISO('2024-01-02')
        }
        const result = await updateActionCommandHandler.handle(
          command,
          undefined,
          actionOrigine
        )

        // Then
        expect(actionRepository.save).to.have.been.calledWithExactly(
          actionModifiee
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const idAction = 'id-action-inexistante'

        // When
        const result = await updateActionCommandHandler.handle({
          idAction,
          statut: Action.Statut.PAS_COMMENCEE,
          contenu: "Nouveau contenu de l'action",
          description: "Nouvelle description de l'action",
          dateEcheance: DateTime.fromISO('2023-12-27')
        })

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', idAction))
        )
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune ou conseiller à modifier une action', async () => {
      // Given
      const command: UpdateActionCommand = {
        idAction: 'idAction',
        statut: Action.Statut.EN_COURS,
        contenu: "Nouveau contenu de l'action",
        description: "Nouvelle description de l'action",
        dateEcheance: DateTime.fromISO('2023-12-27')
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await updateActionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        actionAuthorizer.autoriserPourUneAction
      ).to.have.been.calledWithExactly(command.idAction, utilisateur)
    })
  })

  describe('monitor', () => {
    it('monitore la modification du statut et texte', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      // When
      await updateActionCommandHandler.monitor(utilisateur, {
        idAction: 'id-action',
        statut: Action.Statut.ANNULEE,
        codeQualification: Qualification.Code.SANTE
      })

      // Then
      expect(evenementService.creer).to.have.been.calledTwice()
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_STATUT_MODIFIE,
        utilisateur
      )
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_TEXTE_MODIFIE,
        utilisateur
      )
    })
    it('monitore la modification de la catégorie', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      // When
      await updateActionCommandHandler.monitor(utilisateur, {
        idAction: 'id-action',
        codeQualification: Qualification.Code.SANTE
      })

      // Then
      expect(evenementService.creer).to.have.been.calledOnce()
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_TEXTE_MODIFIE,
        utilisateur
      )
    })

    it('monitore la modification des textes', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      // When
      await updateActionCommandHandler.monitor(utilisateur, {
        idAction: 'id-action',
        description: 'nouvelle description',
        contenu: 'nouveau contenu'
      })

      // Then
      expect(evenementService.creer).to.have.been.calledOnce()
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_TEXTE_MODIFIE,
        utilisateur
      )
    })
  })
})
