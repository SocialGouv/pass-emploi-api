import { uneDatetime } from '../../fixtures/date.fixture'
import { Action } from '../../../src/domain/action/action'
import { CommentaireSqlModel } from '../../../src/infrastructure/sequelize/models/commentaire.sql-model'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { unJeune } from '../../fixtures/jeune.fixture'
import { CommentaireActionSqlRepositoryDb } from '../../../src/infrastructure/repositories/commentaire-action-sql.repository.db'
import { expect, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { IdService } from '../../../src/utils/id-service'
import { DateService } from '../../../src/utils/date-service'

describe('CommentaireActionSqlRepositoryDb', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let commentaireActionSqlRepository: CommentaireActionSqlRepositoryDb
  let conseillerRepository: ConseillerSqlRepository
  let jeuneRepository: JeuneSqlRepository
  const jeune = unJeune()

  beforeEach(async () => {
    commentaireActionSqlRepository = new CommentaireActionSqlRepositoryDb()
    conseillerRepository = new ConseillerSqlRepository()
    jeuneRepository = new JeuneSqlRepository(
      databaseForTesting.sequelize,
      stubClass(FirebaseClient),
      stubClass(IdService),
      stubClass(DateService)
    )

    await conseillerRepository.save(unConseiller())
    await jeuneRepository.save(jeune)
  })

  describe('save', () => {
    it('sauvegarde un commentaire', async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)
      const idCommentaire = '8d8c0686-198d-11ed-861d-0242ac120002'
      const commentaireAction: Action.Commentaire = {
        id: idCommentaire,
        idAction,
        date: uneDatetime(),
        createur: {
          id: '1',
          prenom: 'Nils',
          nom: 'Tavernier',
          type: Action.TypeCreateur.CONSEILLER
        },
        message: 'poi-un-message'
      }
      await CommentaireSqlModel.create(commentaireAction)

      // When
      await commentaireActionSqlRepository.save(commentaireAction)

      // Then
      const commentairesSql = await CommentaireSqlModel.findAll()
      expect(commentairesSql).to.have.length(1)
      expect(commentairesSql[0].get()).to.deep.equal({
        ...commentaireAction,
        date: commentaireAction.date.toJSDate()
      })
    })
  })
})
