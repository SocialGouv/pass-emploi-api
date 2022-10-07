import { expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { GetCommentairesActionQueryHandler } from '../../../src/application/queries/get-commentaires-action.query.handler.db'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import { unUtilisateurDecode } from '../../fixtures/authentification.fixture'
import { ActionSqlRepository } from '../../../src/infrastructure/repositories/action-sql.repository.db'
import { DateService } from '../../../src/utils/date-service'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { IdService } from '../../../src/utils/id-service'
import { unCommentaire, uneAction } from '../../fixtures/action.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { CommentaireActionSqlRepositoryDb } from '../../../src/infrastructure/repositories/commentaire-action-sql.repository.db'
import { Action } from 'src/domain/action/action'
import { uneAutreDatetime, uneDatetime } from '../../fixtures/date.fixture'
import { CommentaireActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { success } from '../../../src/building-blocks/types/result'

describe('GetCommentairesActionQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let getCommentairesActionQueryHandler: GetCommentairesActionQueryHandler
  let actionAuthorizer: StubbedClass<ActionAuthorizer>

  beforeEach(() => {
    actionAuthorizer = stubClass(ActionAuthorizer)
    getCommentairesActionQueryHandler = new GetCommentairesActionQueryHandler(
      actionAuthorizer
    )
  })

  describe('authorize', () => {
    it("authorize l'accès à une action", () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      // When
      getCommentairesActionQueryHandler.authorize(
        { idAction: '721e2108-60f5-4a75-b102-04fe6a40e899' },
        utilisateur
      )

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        '721e2108-60f5-4a75-b102-04fe6a40e899',
        utilisateur
      )
    })
  })

  describe('handle', () => {
    const jeune = unJeune()
    const action = uneAction({ idJeune: jeune.id })
    let commentaireActionRepository: Action.Commentaire.Repository

    beforeEach(async () => {
      const conseillerRepository = new ConseillerSqlRepository()
      const jeuneRepository = new JeuneSqlRepository(
        databaseForTesting.sequelize,
        stubClass(FirebaseClient),
        new IdService(),
        new DateService()
      )
      const actionSqlRepository = new ActionSqlRepository(new DateService())
      commentaireActionRepository = new CommentaireActionSqlRepositoryDb()

      await conseillerRepository.save(unConseiller())
      await jeuneRepository.save(jeune)
      await actionSqlRepository.save(action)
    })

    it("renvoie les commentaires d'une action", async () => {
      // Given
      await commentaireActionRepository.save(
        unCommentaire({
          id: '15e0cf2e-e082-47f1-8cee-e2aa18fd8918',
          message: 'message 2',
          date: uneAutreDatetime(),
          idAction: action.id
        })
      )
      await commentaireActionRepository.save(
        unCommentaire({
          id: 'fe6c4205-afc2-42d0-931b-edd96a9823a9',
          message: 'message 1',
          date: uneDatetime(),
          idAction: action.id
        })
      )

      // When
      const commentaires = await getCommentairesActionQueryHandler.handle({
        idAction: action.id
      })

      // Then
      const expected: CommentaireActionQueryModel[] = [
        {
          id: 'fe6c4205-afc2-42d0-931b-edd96a9823a9',
          message: 'message 1',
          date: uneDatetime().toISO(),
          createur: {
            id: 'poi-id-createur',
            nom: 'poi-nom',
            prenom: 'poi-prenom',
            type: Action.TypeCreateur.CONSEILLER
          }
        },
        {
          id: '15e0cf2e-e082-47f1-8cee-e2aa18fd8918',
          message: 'message 2',
          date: uneAutreDatetime().toISO(),
          createur: {
            id: 'poi-id-createur',
            nom: 'poi-nom',
            prenom: 'poi-prenom',
            type: Action.TypeCreateur.CONSEILLER
          }
        }
      ]
      expect(commentaires).to.deep.equal(success(expected))
    })
  })
})
