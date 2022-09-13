import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { DateService } from '../../utils/date-service'
import { Action } from '../../domain/action/action'
import { DateTime } from 'luxon'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { EvenementEngagementSqlModel } from '../../infrastructure/sequelize/models/evenement-engagement.sql-model'
import { Op } from 'sequelize'
import { Authentification } from '../../domain/authentification'
import { Evenement } from '../../domain/evenement'

export interface GetIndicateursPourConseillerQuery extends Query {
  idJeune: string
  dateDebut: string
  dateFin: string
}

export interface IndicateursPourConseillerQueryModel {
  actions: {
    creees: number
    enRetard: number
    terminees: number
    aEcheance: number
  }
  rendezVous: {
    planifies: number
  }
  offres: {
    consultees: number
    partagees: number
  }
  favoris: {
    offresSauvegardees: number
    recherchesSauvegardees: number
  }
}

export class GetIndicateursPourConseillerQueryHandler extends QueryHandler<
  GetIndicateursPourConseillerQuery,
  Result<IndicateursPourConseillerQueryModel>
> {
  constructor(private dateService: DateService) {
    super('GetIndicateursPourConseillerQueryHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    query: GetIndicateursPourConseillerQuery
  ): Promise<Result<IndicateursPourConseillerQueryModel>> {
    const maintenant = this.dateService.nowJs()
    const dateDebut = DateTime.fromISO(query.dateDebut, {
      setZone: true
    }).toJSDate()
    const dateFin = DateTime.fromISO(query.dateFin, {
      setZone: true
    }).toJSDate()

    const actionsSqlDuJeune: ActionSqlModel[] = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune
      }
    })

    const indicateursActions = this.getIndicateursActions(
      actionsSqlDuJeune,
      dateDebut,
      dateFin,
      maintenant
    )

    const rendezVousSqlDuJeune: RendezVousSqlModel[] =
      await RendezVousSqlModel.findAll({
        include: [
          {
            model: JeuneSqlModel,
            where: { id: query.idJeune }
          }
        ]
      })

    const nombreRendezVousPlanifies = rendezVousSqlDuJeune.filter(
      rendezVousSql => {
        return this.leRendezVousEntreLesDeuxDates(
          rendezVousSql,
          dateDebut,
          dateFin
        )
      }
    ).length

    const offresEtFavorisEvenementsSql =
      await EvenementEngagementSqlModel.findAll({
        where: {
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: query.idJeune,
          dateEvenement: { [Op.between]: [dateDebut, dateFin] }
        }
      })

    const indicateursOffresEtFavoris = this.getIndicateursOffresEtFavoris(
      offresEtFavorisEvenementsSql
    )

    return success({
      actions: indicateursActions,
      rendezVous: {
        planifies: nombreRendezVousPlanifies
      },
      offres: indicateursOffresEtFavoris.offres,
      favoris: indicateursOffresEtFavoris.favoris
    })
  }

  private getIndicateursActions(
    actionsSqlDuJeune: ActionSqlModel[],
    dateDebut: Date,
    dateFin: Date,
    maintenant: Date
  ): {
    creees: number
    enRetard: number
    terminees: number
    aEcheance: number
  } {
    const indicateursActionsResult = actionsSqlDuJeune
      .map(actionSql => {
        return {
          creees: this.lActionEstCreeeEntreLesDeuxDates(
            actionSql,
            dateDebut,
            dateFin
          )
            ? 1
            : 0,
          enRetard: this.lActionEstEnRetard(actionSql, maintenant) ? 1 : 0,
          terminees: this.lActionEstTermineeEntreLesDeuxDates(
            actionSql,
            dateDebut,
            dateFin
          )
            ? 1
            : 0,
          aEcheance: this.lActionEstAEcheanceEntreLesDeuxDates(
            actionSql,
            dateDebut,
            dateFin
          )
            ? 1
            : 0
        }
      })
      .reduce(
        (indicateursActionsAccumulateur, indicateursAction) => {
          indicateursActionsAccumulateur.creees += indicateursAction.creees
          indicateursActionsAccumulateur.enRetard += indicateursAction.enRetard
          indicateursActionsAccumulateur.terminees +=
            indicateursAction.terminees
          indicateursActionsAccumulateur.aEcheance +=
            indicateursAction.aEcheance
          return indicateursActionsAccumulateur
        },
        {
          creees: 0,
          enRetard: 0,
          terminees: 0,
          aEcheance: 0
        }
      )
    return indicateursActionsResult
  }

  private getIndicateursOffresEtFavoris(
    evenementsSql: EvenementEngagementSqlModel[]
  ): {
    offres: { consultees: number; partagees: number }
    favoris: { offresSauvegardees: number; recherchesSauvegardees: number }
  } {
    const codesOffreConsultee: string[] = [
      Evenement.Code.OFFRE_ALTERNANCE_AFFICHEE,
      Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
      Evenement.Code.OFFRE_IMMERSION_AFFICHEE,
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHEE
    ]
    const codesOffrePartagee: string[] = [
      Evenement.Code.OFFRE_ALTERNANCE_PARTAGEE,
      Evenement.Code.OFFRE_EMPLOI_PARTAGEE,
      Evenement.Code.OFFRE_IMMERSION_PARTAGEE,
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_PARTAGEE
    ]
    const codesOffreSauvegardee: string[] = [
      Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE,
      Evenement.Code.OFFRE_EMPLOI_SAUVEGARDEE,
      Evenement.Code.OFFRE_IMMERSION_SAUVEGARDEE,
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE
    ]
    const codesRechercheSauvegardee: string[] = [
      Evenement.Code.RECHERCHE_ALTERNANCE_SAUVEGARDEE,
      Evenement.Code.RECHERCHE_IMMERSION_SAUVEGARDEE,
      Evenement.Code.RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE,
      Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE
    ]

    const indicateursOffresEtFavorisResult = evenementsSql
      .map(evenementSql => {
        return {
          offres: {
            consultees: codesOffreConsultee.includes(evenementSql.code) ? 1 : 0,
            partagees: codesOffrePartagee.includes(evenementSql.code) ? 1 : 0
          },
          favoris: {
            offresSauvegardees: codesOffreSauvegardee.includes(
              evenementSql.code
            )
              ? 1
              : 0,
            recherchesSauvegardees: codesRechercheSauvegardee.includes(
              evenementSql.code
            )
              ? 1
              : 0
          }
        }
      })
      .reduce(
        (
          indicateursOffresEtFavorisAccumulateur,
          indicateursOffresEtFavoris
        ) => {
          indicateursOffresEtFavorisAccumulateur.offres.consultees +=
            indicateursOffresEtFavoris.offres.consultees
          indicateursOffresEtFavorisAccumulateur.offres.partagees +=
            indicateursOffresEtFavoris.offres.partagees
          indicateursOffresEtFavorisAccumulateur.favoris.offresSauvegardees +=
            indicateursOffresEtFavoris.favoris.offresSauvegardees
          indicateursOffresEtFavorisAccumulateur.favoris.recherchesSauvegardees +=
            indicateursOffresEtFavoris.favoris.recherchesSauvegardees
          return indicateursOffresEtFavorisAccumulateur
        },
        {
          offres: {
            consultees: 0,
            partagees: 0
          },
          favoris: {
            offresSauvegardees: 0,
            recherchesSauvegardees: 0
          }
        }
      )

    return indicateursOffresEtFavorisResult
  }

  async monitor(): Promise<void> {
    return
  }

  private lActionEstTermineeEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return Boolean(
      actionSql.dateFinReelle ??
        DateService.isBetweenDates(actionSql.dateFinReelle!, dateDebut, dateFin)
    )
  }

  private lActionEstEnRetard(
    actionSql: ActionSqlModel,
    maintenant: Date
  ): boolean {
    return (
      actionSql.dateEcheance < maintenant &&
      actionSql.statut !== Action.Statut.TERMINEE &&
      actionSql.statut !== Action.Statut.ANNULEE
    )
  }

  private lActionEstCreeeEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return DateService.isBetweenDates(
      actionSql.dateCreation,
      dateDebut,
      dateFin
    )
  }

  private lActionEstAEcheanceEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return DateService.isBetweenDates(
      actionSql.dateEcheance,
      dateDebut,
      dateFin
    )
  }

  private leRendezVousEntreLesDeuxDates(
    rendezVousSql: RendezVousSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return DateService.isBetweenDates(rendezVousSql.date, dateDebut, dateFin)
  }
}
