import { Injectable } from '@nestjs/common'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Action } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { fromSqlToActionQueryModelWithJeune } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { ActionQueryModel } from '../query-models/actions.query-model'

export interface GetActionsJeuneQuery extends Query {
  idJeune: string
  dateDebut: string
  dateFin: string
  statuts?: Action.Statut[]
  etats?: Action.Qualification.Etat[]
  codesCategories?: Action.Qualification.Code[]
}

@Injectable()
export class GetActionsJeuneQueryHandler extends QueryHandler<
  GetActionsJeuneQuery,
  Result<ActionQueryModel[]>
> {
  constructor(
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetActionsJeuneQueryHandler')
  }

  async handle(
    query: GetActionsJeuneQuery
  ): Promise<Result<ActionQueryModel[]>> {
    const actionsSqlFiltrees = await this.findAllActionsFiltrees(query)

    return success(actionsSqlFiltrees.map(fromSqlToActionQueryModelWithJeune))
  }

  async authorize(
    query: GetActionsJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
      query.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }

  private async findAllActionsFiltrees(
    query: GetActionsJeuneQuery
  ): Promise<ActionSqlModel[]> {
    return ActionSqlModel.findAll({
      where: this.generateWhere(query),
      order: [
        ['date_echeance', 'DESC'],
        ['date_creation', 'ASC']
      ],
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })
  }

  private generateWhere(query: GetActionsJeuneQuery): WhereOptions {
    const inPeriode = { [Op.between]: [query.dateDebut, query.dateFin] }

    const where: WhereOptions = [
      {
        id_jeune: query.idJeune,
        [Op.or]: [
          { date_fin_reelle: inPeriode },
          { [Op.and]: { date_fin_reelle: null, date_debut: inPeriode } },
          {
            [Op.and]: {
              date_fin_reelle: null,
              date_debut: null,
              date_echeance: inPeriode
            }
          }
        ]
      }
    ]

    if (query.etats?.length) {
      where.push(
        Sequelize.where(
          Sequelize.literal(`CASE
            WHEN qualification_heures IS NOT null THEN 'QUALIFIEE'
            WHEN statut = 'done' AND dispositif = 'CEJ' THEN 'A_QUALIFIER'
            ELSE 'NON_QUALIFIABLE'
          END`),
          {
            [Op.in]: query.etats
          }
        )
      )
    }
    if (query.statuts) where.push({ statut: query.statuts })
    if (query.codesCategories)
      where.push({ qualification_code: { [Op.in]: query.codesCategories } })

    return where
  }
}
