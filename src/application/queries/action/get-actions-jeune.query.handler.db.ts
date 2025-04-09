import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { fromSqlToActionQueryModelWithJeune } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { ActionQueryModel } from '../query-models/actions.query-model'

export interface GetActionsJeuneQuery extends Query {
  idJeune: string
  dateDebut: DateTime
  dateFin: DateTime
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
    const actionsSqlFiltrees = await this.findAllActionsPeriode(query)

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

  private async findAllActionsPeriode(
    query: GetActionsJeuneQuery
  ): Promise<ActionSqlModel[]> {
    const inPeriode = {
      [Op.between]: [query.dateDebut.toJSDate(), query.dateFin.toJSDate()]
    }

    return ActionSqlModel.findAll({
      where: [
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
      ],
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
}
