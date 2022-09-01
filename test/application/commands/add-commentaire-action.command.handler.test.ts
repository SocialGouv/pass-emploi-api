import {
  AddCommentaireActionCommand,
  AddCommentaireActionCommandHandler
} from '../../../src/application/commands/add-commentaire-action.command.handler'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { unCommentaire, uneAction } from '../../fixtures/action.fixture'
import { Action } from '../../../src/domain/action/action'
import {
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { uneConfiguration } from '../../fixtures/jeune.fixture'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Notification } from '../../../src/domain/notification/notification'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import TypeCreateur = Action.TypeCreateur

describe('AddCommentaireActionCommandHandler', () => {
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let commentaireActionFactory: StubbedClass<Action.Commentaire.Factory>
  let actionRepository: StubbedType<Action.Repository>
  let commentaireActionRepository: StubbedType<Action.Commentaire.Repository>
  let jeuneConfigurationApplicationRepository: StubbedType<Jeune.ConfigurationApplication.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let evenementService: StubbedClass<EvenementService>
  let addCommentaireActionCommandHandler: AddCommentaireActionCommandHandler

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    actionAuthorizer = stubClass(ActionAuthorizer)
    commentaireActionFactory = stubClass(Action.Commentaire.Factory)
    actionRepository = stubInterface(sandbox)
    commentaireActionRepository = stubInterface(sandbox)
    jeuneConfigurationApplicationRepository = stubInterface(sandbox)
    notificationService = stubClass(Notification.Service)
    evenementService = stubClass(EvenementService)
    addCommentaireActionCommandHandler = new AddCommentaireActionCommandHandler(
      actionAuthorizer,
      actionRepository,
      commentaireActionRepository,
      commentaireActionFactory,
      jeuneConfigurationApplicationRepository,
      notificationService,
      evenementService
    )
  })

  describe('handle', () => {
    const utilisateur = unUtilisateurDecode()
    const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
    const commentaire = 'poi-commentaire'
    const commentaireAction: Action.Commentaire = unCommentaire({
      message: commentaire
    })

    describe("quand l'action existe", () => {
      it("ajoute un commentaire à l'action", async () => {
        // Given
        const actionInitiale = uneAction({
          id: idAction
        })
        actionRepository.get.withArgs(idAction).returns(actionInitiale)

        const createurAction: Action.Createur = {
          id: utilisateur.id,
          type: Action.TypeCreateur.CONSEILLER,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom
        }

        const command: AddCommentaireActionCommand = {
          idAction,
          commentaire,
          createur: utilisateur
        }

        commentaireActionFactory.build
          .withArgs(actionInitiale, command.commentaire, createurAction)
          .returns(commentaireAction)

        // When

        await addCommentaireActionCommandHandler.handle(command)
        // Then
        expect(commentaireActionRepository.save).to.have.been.calledWithExactly(
          commentaireAction
        )
      })
    })
    describe("quand l'action n'existe pas", () => {
      it('retourne une erreur', async () => {
        // Given
        const command: AddCommentaireActionCommand = {
          idAction,
          commentaire,
          createur: utilisateur
        }
        actionRepository.get.returns(undefined)

        // When
        const result = await addCommentaireActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', idAction))
        )
      })
    })
  })

  describe('notifications push à destination du jeune', () => {
    const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
    const pushToken = 'poi-push-token'

    it('notifie quand le commentaire vient du conseiller', async () => {
      // Given
      const actionConseiller = uneAction({
        id: idAction
      })
      actionRepository.get.withArgs(idAction).returns(actionConseiller)

      const commentaire = 'poi-commentaire'
      const utilisateurConseiller = unUtilisateurDecode()

      const command: AddCommentaireActionCommand = {
        idAction,
        commentaire,
        createur: utilisateurConseiller
      }
      const configAppJeune = uneConfiguration({
        pushNotificationToken: pushToken
      })
      jeuneConfigurationApplicationRepository.get
        .withArgs(actionConseiller.idJeune)
        .returns(configAppJeune)

      // When
      await addCommentaireActionCommandHandler.handle(command)

      // Then
      expect(
        notificationService.notifierNouveauCommentaireAction
      ).to.have.been.calledWith(idAction, configAppJeune)
    })
    it('ne notifie pas quand le commentaire vient du conseiller', async () => {
      // Given
      const actionJeune = uneAction({
        id: idAction,
        createur: {
          id: '1',
          nom: 'poi-nom',
          prenom: 'poi-prenom',
          type: TypeCreateur.JEUNE
        }
      })
      actionRepository.get.withArgs(idAction).returns(actionJeune)

      const commentaire = 'poi-commentaire'
      const utilisateurJeune = unUtilisateurJeune()

      const command: AddCommentaireActionCommand = {
        idAction,
        commentaire,
        createur: utilisateurJeune
      }
      const configAppJeune = uneConfiguration({
        pushNotificationToken: pushToken
      })
      jeuneConfigurationApplicationRepository.get
        .withArgs(actionJeune.idJeune)
        .returns(configAppJeune)

      // When
      await addCommentaireActionCommandHandler.handle(command)

      // Then
      expect(
        notificationService.notifierNouveauCommentaireAction
      ).not.to.have.been.called()
    })
  })

  describe('monitor', () => {
    it("enregistre un évènement d'engagement de type Action Ajout Commentaire", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      // When
      await addCommentaireActionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWithExactly(
        Evenement.Type.ACTION_COMMENTEE,
        utilisateur
      )
    })
  })
})
