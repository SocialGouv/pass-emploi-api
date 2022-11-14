import { Injectable } from '@nestjs/common'
import { JeuneHomeSuiviQueryModel } from './query-models/home-jeune-suivi.query-model'
import { Result, success } from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { fromSqlToActionQueryModel } from '../../infrastructure/repositories/mappers/actions.mappers'
import { Op } from 'sequelize'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { DateTime } from 'luxon'
import { ActionQueryModel } from './query-models/actions.query-model'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'
import { Action } from '../../domain/action/action'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'

const NUMERO_DU_JOUR_SAMEDI = 6

export interface GetJeuneHomeAgendaQuery extends Query {
  idJeune: string
  maintenant: string
}

@Injectable()
export class GetJeuneHomeAgendaQueryHandler extends QueryHandler<
  GetJeuneHomeAgendaQuery,
  Result<JeuneHomeSuiviQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer
  ) {
    super('GetJeuneHomeAgendaQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaQuery
  ): Promise<Result<JeuneHomeSuiviQueryModel>> {
    const { samediDernier, vendrediEnHuit } =
      this.recupererLesDatesEntreSamediDernierEtDeuxSemainesPlusTard(
        query.maintenant
      )
    const [actions, rendezVous, actionsEnRetard] = await Promise.all([
      this.recupererLesActions(query, samediDernier, vendrediEnHuit),
      this.recupererLesRendezVous(query, samediDernier, vendrediEnHuit),
      this.recupererLeNombreDactionsEnRetard(query)
    ])
    return success({
      actions,
      rendezVous,
      metadata: {
        actionsEnRetard: actionsEnRetard,
        dateDeDebut: samediDernier.toJSDate(),
        dateDeFin: vendrediEnHuit.toJSDate()
      }
    })
  }

  async authorize(
    query: GetJeuneHomeAgendaQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return await this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    }
    return await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private recupererLesDatesEntreSamediDernierEtDeuxSemainesPlusTard(
    maintenant: string
  ): {
    samediDernier: DateTime
    vendrediEnHuit: DateTime
  } {
    let dateDebut = DateTime.fromISO(maintenant, {
      setZone: true
    }).startOf('day')
    while (dateDebut.weekday !== NUMERO_DU_JOUR_SAMEDI) {
      dateDebut = dateDebut.minus({ day: 1 })
    }
    const vendrediEnHuit = dateDebut.plus({ day: 14 })
    return { samediDernier: dateDebut, vendrediEnHuit }
  }

  private async recupererLesRendezVous(
    query: GetJeuneHomeAgendaQuery,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<RendezVousJeuneQueryModel[]> {
    const rendezVousSqlModel = await RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: query.idJeune },
          include: [ConseillerSqlModel]
        }
      ],
      where: {
        date: {
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lte]: dateFin.toJSDate()
        }
      },
      order: [['date', 'ASC']]
    })

    return rendezVousSqlModel.map(fromSqlToRendezVousJeuneQueryModel)
  }

  private async recupererLesActions(
    query: GetJeuneHomeAgendaQuery,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lt]: dateFin.toJSDate()
        }
      },
      order: [['dateEcheance', 'ASC']]
    })

    return actionsSqlModel.map(fromSqlToActionQueryModel)
  }

  private async recupererLeNombreDactionsEnRetard(
    query: GetJeuneHomeAgendaQuery
  ): Promise<number> {
    return ActionSqlModel.count({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.lt]: query.maintenant
        },
        statut: {
          [Op.notIn]: [Action.Statut.ANNULEE, Action.Statut.TERMINEE]
        }
      }
    })
  }
}
