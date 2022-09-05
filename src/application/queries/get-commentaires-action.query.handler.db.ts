import { Injectable } from '@nestjs/common'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { CommentaireActionQueryModel } from './query-models/actions.query-model'
import { ActionAuthorizer } from '../authorizers/authorize-action'
import { CommentaireSqlModel } from '../../infrastructure/sequelize/models/commentaire.sql-model'

export interface GetCommentairesAction extends Query {
  idAction: string
}

@Injectable()
export class GetCommentairesActionQueryHandler extends QueryHandler<
  GetCommentairesAction,
  Result<CommentaireActionQueryModel[]>
> {
  constructor(private actionAuthorizer: ActionAuthorizer) {
    super('GetCommentairesActionQueryHandler')
  }

  async handle(
    query: GetCommentairesAction
  ): Promise<Result<CommentaireActionQueryModel[]>> {
    const commentairesSql = await CommentaireSqlModel.findAll({
      where: {
        idAction: query.idAction
      },
      order: [['date', 'ASC']]
    })

    const commentairesQueryModel: CommentaireActionQueryModel[] =
      commentairesSql.map(commentaireSql => {
        return {
          id: commentaireSql.id,
          date: commentaireSql.date,
          createur: commentaireSql.createur,
          message: commentaireSql.message
        }
      })

    return success(commentairesQueryModel)
  }

  async authorize(
    query: GetCommentairesAction,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.actionAuthorizer.authorize(query.idAction, utilisateur)
  }

  monitor(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
