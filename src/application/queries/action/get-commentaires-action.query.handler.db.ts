import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { CommentaireSqlModel } from '../../../infrastructure/sequelize/models/commentaire.sql-model'
import { ActionAuthorizer } from '../../authorizers/action-authorizer'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { CommentaireActionQueryModel } from '../query-models/actions.query-model'

export interface GetCommentairesAction extends Query {
  idAction: string
}

@Injectable()
export class GetCommentairesActionQueryHandler extends QueryHandler<
  GetCommentairesAction,
  Result<CommentaireActionQueryModel[]>
> {
  constructor(
    private actionAuthorizer: ActionAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
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
          date: DateTime.fromJSDate(commentaireSql.date).toISO(),
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
    if (Authentification.estConseiller(utilisateur.type)) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourUneActionDeSonJeuneOuDUnJeuneDeSonAgenceMilo(
        query.idAction,
        utilisateur
      )
    }
    return this.actionAuthorizer.autoriserPourUneAction(
      query.idAction,
      utilisateur
    )
  }

  monitor(): Promise<void> {
    return Promise.resolve(undefined)
  }
}
