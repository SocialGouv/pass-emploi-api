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
import { generateSourceRendezVousCondition } from '../../config/feature-flipping'
import { ConfigService } from '@nestjs/config'

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
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private configuration: ConfigService
  ) {
    super('GetJeuneHomeAgendaQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaQuery
  ): Promise<Result<JeuneHomeSuiviQueryModel>> {
    const { lundiDernier, dimancheEnHuit } =
      this.recupererLesDatesEntreLundiDernierEtDeuxSemainesPlusTard(
        query.maintenant
      )
    const [actions, rendezVous, actionsEnRetard] = await Promise.all([
      this.recupererLesActions(query, lundiDernier, dimancheEnHuit),
      this.recupererLesRendezVous(query, lundiDernier, dimancheEnHuit),
      this.recupererLeNombreDactionsEnRetard(query)
    ])
    return success({
      actions,
      rendezVous,
      metadata: {
        actionsEnRetard: actionsEnRetard,
        dateDeDebut: lundiDernier.toJSDate(),
        dateDeFin: dimancheEnHuit.toJSDate()
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
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private recupererLesDatesEntreLundiDernierEtDeuxSemainesPlusTard(
    maintenant: string
  ): {
    lundiDernier: DateTime
    dimancheEnHuit: DateTime
  } {
    const dateDebut = DateTime.fromISO(maintenant, {
      setZone: true
    }).startOf('week')
    const dimancheEnHuit = dateDebut.plus({ day: 14 })
    return { lundiDernier: dateDebut, dimancheEnHuit: dimancheEnHuit }
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
        ...generateSourceRendezVousCondition(this.configuration),
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
