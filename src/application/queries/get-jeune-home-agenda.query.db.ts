import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { generateSourceRendezVousCondition } from '../../config/feature-flipping'
import { Action } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { fromSqlToActionQueryModel } from '../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { ConseillerAgenceAuthorizer } from '../authorizers/authorize-conseiller-agence'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { ActionQueryModel } from './query-models/actions.query-model'
import { JeuneHomeSuiviQueryModel } from './query-models/home-jeune-suivi.query-model'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'

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
    private conseillerAgenceAuthorizer: ConseillerAgenceAuthorizer,
    private configuration: ConfigService
  ) {
    super('GetJeuneHomeAgendaQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<JeuneHomeSuiviQueryModel>> {
    const { lundiDernier, dimancheEnHuit } =
      this.recupererLesDatesEntreLundiDernierEtDeuxSemainesPlusTard(
        query.maintenant
      )
    const [actions, rendezVous, actionsEnRetard] = await Promise.all([
      this.recupererLesActions(query, lundiDernier, dimancheEnHuit),
      this.recupererLesRendezVous(
        query,
        lundiDernier,
        dimancheEnHuit,
        utilisateur.type
      ),
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
      return this.conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgence(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.authorizeJeune(query.idJeune, utilisateur)
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
    dateFin: DateTime,
    typeUtilisateur: Authentification.Type
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

    return rendezVousSqlModel.map(rdvSql =>
      fromSqlToRendezVousJeuneQueryModel(rdvSql, typeUtilisateur)
    )
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
