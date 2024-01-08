import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { PlanificateurService } from 'src/domain/planificateur'
import { stubClassSandbox } from 'test/utils/types'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../../../src/application/commands/action/create-action.command.handler'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { Action } from '../../../../src/domain/action/action'
import { Authentification } from '../../../../src/domain/authentification'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { Notification } from '../../../../src/domain/notification/notification'
import { uneAction } from '../../../fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../../utils'

describe('CreateActionCommandHandler', () => {
  let action: Action
  let jeune: Jeune
  let actionRepository: StubbedType<Action.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let actionFactory: StubbedClass<Action.Factory>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let createActionCommandHandler: CreateActionCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let planificateurService: StubbedClass<PlanificateurService>

  beforeEach(async () => {
    action = uneAction()
    jeune = unJeune()
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierNouvelleAction.resolves()
    jeuneRepository.get.withArgs(action.idJeune).resolves(jeune)
    actionFactory = stubClass(Action.Factory)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    evenementService = stubClass(EvenementService)
    planificateurService = stubClass(PlanificateurService)
    planificateurService.planifierRappelAction.resolves()

    createActionCommandHandler = new CreateActionCommandHandler(
      actionRepository,
      jeuneRepository,
      notificationService,
      actionFactory,
      jeuneAuthorizer,
      conseillerAuthorizer,
      evenementService,
      planificateurService
    )
  })
  describe('handle', () => {
    it("renvoie une failure quand le jeune n'est pas trouvé", async () => {
      // Given
      jeuneRepository.get.withArgs(action.idJeune).resolves(undefined)

      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: action.contenu,
        idCreateur: action.id,
        typeCreateur: Action.TypeCreateur.JEUNE,
        statut: action.statut,
        commentaire: action.description,
        dateEcheance: action.dateEcheance
      }

      // When
      const result = await createActionCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Jeune', command.idJeune))
      )
    })
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
          commentaire: action.description,
          dateEcheance: action.dateEcheance
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
          commentaire: action.description,
          dateEcheance: action.dateEcheance
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
    describe('rappel', () => {
      describe('quand il faut planifier un rappel', () => {
        it('planifie un rappel', async () => {
          // Given
          actionFactory.buildAction.returns(success(action))
          actionFactory.doitPlanifierUneNotificationDeRappel
            .withArgs(action)
            .returns(true)
          const command: CreateActionCommand = {
            idJeune: action.idJeune,
            contenu: action.contenu,
            idCreateur: action.id,
            typeCreateur: Action.TypeCreateur.JEUNE,
            statut: action.statut,
            commentaire: action.description,
            dateEcheance: action.dateEcheance,
            rappel: action.rappel
          }

          // When
          await createActionCommandHandler.handle(command)

          // Then
          expect(
            planificateurService.planifierRappelAction
          ).to.have.been.calledOnceWithExactly(action)
        })
      })
      describe('quand il ne faut pas  planifier un rappel', () => {
        it('ne planifie pas de rappel', async () => {
          // Given
          actionFactory.buildAction.returns(success(action))
          actionFactory.doitPlanifierUneNotificationDeRappel
            .withArgs(action)
            .returns(false)
          const command: CreateActionCommand = {
            idJeune: action.idJeune,
            contenu: action.contenu,
            idCreateur: action.id,
            typeCreateur: Action.TypeCreateur.JEUNE,
            statut: action.statut,
            commentaire: action.description,
            dateEcheance: action.dateEcheance,
            rappel: action.rappel
          }

          // When
          await createActionCommandHandler.handle(command)

          // Then
          expect(
            planificateurService.planifierRappelAction
          ).not.to.have.been.called()
        })
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
          commentaire: action.description,
          dateEcheance: action.dateEcheance
        }

        const utilisateur: Authentification.Utilisateur = unUtilisateurJeune()

        // When
        await createActionCommandHandler.authorize(command, utilisateur)

        // Then
        expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
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
          commentaire: action.description,
          dateEcheance: action.dateEcheance
        }

        // When
        await createActionCommandHandler.authorize(command, utilisateur)

        // Then
        expect(
          conseillerAuthorizer.autoriserLeConseillerPourSonJeune
        ).to.have.been.calledWithExactly(
          command.idCreateur,
          command.idJeune,
          utilisateur
        )
      })
    })
  })

  describe('monitor', () => {
    it("créé l'événement idoine", () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: 'whatever',
        idCreateur: utilisateur.id,
        typeCreateur: Action.TypeCreateur.CONSEILLER,
        statut: action.statut,
        commentaire: action.description,
        dateEcheance: action.dateEcheance
      }

      // When
      createActionCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_CREEE_HORS_REFERENTIEL,
        utilisateur
      )
    })
    it("créé l'événement idoine si l'action provient du referentiel d'actions prédéfinies Conseiller", () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: Action.ACTIONS_PREDEFINIES[5].titre,
        idCreateur: utilisateur.id,
        typeCreateur: Action.TypeCreateur.CONSEILLER,
        statut: action.statut,
        commentaire: action.description,
        dateEcheance: action.dateEcheance
      }

      // When
      createActionCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_CREEE_REFERENTIEL,
        utilisateur
      )
    })
    it("créé l'événement idoine si l'action provient d'une suggestion Jeune'", () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: 'test',
        idCreateur: utilisateur.id,
        typeCreateur: Action.TypeCreateur.JEUNE,
        statut: action.statut,
        commentaire: action.description,
        dateEcheance: action.dateEcheance,
        codeQualification: Action.Qualification.Code.CITOYENNETE
      }

      // When
      createActionCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_CREEE_SUGGESTION,
        utilisateur
      )
    })
    it("créé l'événement idoine si l'action provient d'un Jeune'", () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: 'test',
        idCreateur: utilisateur.id,
        typeCreateur: Action.TypeCreateur.JEUNE,
        statut: action.statut,
        commentaire: action.description,
        dateEcheance: action.dateEcheance
      }

      // When
      createActionCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_CREEE_HORS_SUGGESTION,
        utilisateur
      )
    })
  })
})
