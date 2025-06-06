import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { estMilo } from 'src/domain/core'
import { FavoriOffreEmploiSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../utils/date-service'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { IndicateursPourConseillerQueryModel } from './query-models/indicateurs-pour-conseiller.query-model'

export interface GetIndicateursPourConseillerQuery extends Query {
  idConseiller: string
  idJeune: string
  periode: Periode
  accessToken: string
}
type Periode = { debut: Date; fin: Date }

@Injectable()
export class GetIndicateursPourConseillerQueryHandler extends QueryHandler<
  GetIndicateursPourConseillerQuery,
  Result<IndicateursPourConseillerQueryModel>
> {
  constructor(
    private dateService: DateService,
    private getSessionsJeuneMiloQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetIndicateursPourConseillerQueryHandler')
  }

  async authorize(
    query: GetIndicateursPourConseillerQuery,
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

  async handle(
    query: GetIndicateursPourConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<IndicateursPourConseillerQueryModel>> {
    const maintenant = this.dateService.nowJs()

    const favorisSql = await findAllFavorisPostulesOuCreesPendantPeriode(query)

    let actionsSqlDuJeune: ActionSqlModel[] = []
    let rendezVousSqlDuJeune: RendezVousSqlModel[] = []
    let sessionsDuJeune: SessionJeuneMiloQueryModel[] = []
    if (estMilo(utilisateur.structure)) {
      ;[actionsSqlDuJeune, rendezVousSqlDuJeune, sessionsDuJeune] =
        await Promise.all([
          findAllActions(query),
          findAllRendezVous(query),
          this.findAllSessions(query)
        ])
    }

    const indicateursActions = getIndicateursActions(
      actionsSqlDuJeune,
      query.periode,
      maintenant
    )

    const indicateursSuiviOffres = getIndicateursSuiviOffres(
      favorisSql,
      query.periode
    )

    return success({
      actions: indicateursActions,
      rendezVous: {
        planifies: rendezVousSqlDuJeune.length + sessionsDuJeune.length
      },
      offres: indicateursSuiviOffres
    })
  }

  private async findAllSessions(
    query: GetIndicateursPourConseillerQuery
  ): Promise<SessionJeuneMiloQueryModel[]> {
    const debut = DateTime.fromJSDate(query.periode.debut)
    const fin = DateTime.fromJSDate(query.periode.fin)
    const sessionsJeuneAEteInscrit =
      await this.getSessionsJeuneMiloQueryGetter.handle(
        query.idJeune,
        query.accessToken,
        {
          periode: { debut, fin },
          filtrerEstInscrit: true,
          pourConseiller: true
        }
      )

    if (isFailure(sessionsJeuneAEteInscrit)) return []
    return sessionsJeuneAEteInscrit.data
  }
}

function findAllActions(
  query: GetIndicateursPourConseillerQuery
): Promise<ActionSqlModel[]> {
  return ActionSqlModel.findAll({
    where: {
      idJeune: query.idJeune
    }
  })
}

function findAllRendezVous(
  query: GetIndicateursPourConseillerQuery
): Promise<RendezVousSqlModel[]> {
  const { idJeune, periode } = query
  return RendezVousSqlModel.findAll({
    where: {
      date: { [Op.between]: [periode.debut, periode.fin] }
    },
    include: [
      {
        model: JeuneSqlModel,
        where: { id: idJeune }
      }
    ]
  })
}

async function findAllFavorisPostulesOuCreesPendantPeriode(
  query: GetIndicateursPourConseillerQuery
): Promise<Array<{ dateCreation: Date; dateCandidature: Date | null }>> {
  const { idJeune, periode } = query
  const options = {
    attributes: ['dateCreation', 'dateCandidature'],
    where: {
      idJeune: idJeune,
      [Op.or]: {
        dateCreation: { [Op.between]: [periode.debut, periode.fin] },
        dateCandidature: { [Op.between]: [periode.debut, periode.fin] }
      }
    }
  }
  const [offresEmploi, offresServiceCivique, offresImmersion] =
    await Promise.all([
      FavoriOffreEmploiSqlModel.findAll(options),
      FavoriOffreEngagementSqlModel.findAll(options),
      FavoriOffreImmersionSqlModel.findAll(options)
    ])

  return [...offresEmploi, ...offresServiceCivique, ...offresImmersion]
}

function getIndicateursActions(
  actionsSqlDuJeune: ActionSqlModel[],
  periode: Periode,
  maintenant: Date
): {
  creees: number
  enRetard: number
  terminees: number
} {
  const indicateurs = { creees: 0, enRetard: 0, terminees: 0 }
  actionsSqlDuJeune.forEach(action => {
    indicateurs.creees += +actionCreeePendantPeriode(action, periode)
    if (actionEnRetard(action, maintenant)) indicateurs.enRetard += 1
    else if (actionTermineePendantPeriode(action, periode))
      indicateurs.terminees += 1
  })

  return indicateurs
}

function getIndicateursSuiviOffres(
  favorisSql: Array<{ dateCreation: Date; dateCandidature: Date | null }>,
  periode: Periode
): {
  sauvegardees: number
  postulees: number
} {
  const indicateurs = { sauvegardees: 0, postulees: 0 }
  favorisSql.forEach(({ dateCreation, dateCandidature }) => {
    indicateurs.sauvegardees += +offreSauvegardeePendantPeriode(
      dateCreation,
      periode
    )
    indicateurs.postulees += +(dateCandidature !== null)
  })

  return indicateurs
}

function actionCreeePendantPeriode(
  actionSql: ActionSqlModel,
  periode: Periode
): boolean {
  return DateService.isBetweenDates(
    actionSql.dateCreation,
    periode.debut,
    periode.fin
  )
}

function actionEnRetard(actionSql: ActionSqlModel, maintenant: Date): boolean {
  return (
    actionSql.dateEcheance < maintenant &&
    actionSql.statut !== Action.Statut.TERMINEE &&
    actionSql.statut !== Action.Statut.ANNULEE
  )
}

function actionTermineePendantPeriode(
  actionSql: ActionSqlModel,
  periode: Periode
): boolean {
  return (
    actionSql.statut === Action.Statut.TERMINEE &&
    actionSql.dateFinReelle !== null &&
    DateService.isBetweenDates(
      actionSql.dateFinReelle,
      periode.debut,
      periode.fin
    )
  )
}

function offreSauvegardeePendantPeriode(
  dateCreation: Date,
  periode: Periode
): boolean {
  return DateService.isBetweenDates(dateCreation, periode.debut, periode.fin)
}
