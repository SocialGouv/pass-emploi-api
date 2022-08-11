import { Injectable } from '@nestjs/common'
import { Action } from '../../domain/action/action'
import { CommentaireSqlModel } from '../sequelize/models/commentaire.sql-model'

@Injectable()
export class CommentaireActionSqlRepositoryDb
  implements Action.Commentaire.Repository
{
  async save(commentaire: Action.Commentaire): Promise<void> {
    await CommentaireSqlModel.upsert(commentaire)
  }
}
