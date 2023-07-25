import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime, Interval } from 'luxon'
import { Op } from 'sequelize'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result, success } from 'src/building-blocks/types/result'
import { generateSourceRendezVousCondition } from 'src/config/feature-flipping'
import { Action } from 'src/domain/action/action'
import { Authentification } from 'src/domain/authentification'
import { fromSqlToActionQueryModel } from 'src/infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { ActionQueryModel } from './query-models/actions.query-model'
import { JeuneHomeAgendaQueryModel } from './query-models/home-jeune-suivi.query-model'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'
import {
  GetSessionsJeuneMiloQueryGetter,
  sessionsAvecInscriptionTriees
} from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'

export interface GetJeuneHomeAgendaQuery extends Query {
  idJeune: string
  maintenant: string
  token: string
}

@Injectable()
export class GetJeuneHomeAgendaQueryHandler extends QueryHandler<
  GetJeuneHomeAgendaQuery,
  Result<JeuneHomeAgendaQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
    private configuration: ConfigService
  ) {
    super('GetJeuneHomeAgendaQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<JeuneHomeAgendaQueryModel>> {
    const { lundiDernier, dimancheEnHuit } =
      this.recupererLesDatesEntreLundiDernierEtDeuxSemainesPlusTard(
        query.maintenant
      )
    const [actions, rendezVous, actionsEnRetard, sessionsQueryModels] =
      await Promise.all([
        this.recupererLesActions(query, lundiDernier, dimancheEnHuit),
        this.recupererLesRendezVous(
          query,
          lundiDernier,
          dimancheEnHuit,
          utilisateur.type
        ),
        this.recupererLeNombreDactionsEnRetard(query),
        this.getSessionsQueryGetter.handle({
          idJeune: query.idJeune,
          token: query.token,
          periode: Interval.fromDateTimes(lundiDernier, dimancheEnHuit)
        })
      ])

    const sessionsMilo = sessionsAvecInscriptionTriees(sessionsQueryModels)

    return success({
      actions,
      rendezVous,
      sessionsMilo,
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
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
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
