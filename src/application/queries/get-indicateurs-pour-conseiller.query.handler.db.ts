import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { Evenement } from '../../domain/evenement'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { EvenementEngagementHebdoSqlModel } from '../../infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../utils/date-service'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { IndicateursPourConseillerQueryModel } from './query-models/indicateurs-pour-conseiller.query-model'

export interface GetIndicateursPourConseillerQuery extends Query {
  idConseiller: string
  idJeune: string
  dateDebut: Date
  dateFin: Date
  exclure?: GetIndicateursPourConseillerExclusionQuery
}

export interface GetIndicateursPourConseillerExclusionQuery {
  offresEtFavoris: boolean
}

@Injectable()
export class GetIndicateursPourConseillerQueryHandler extends QueryHandler<
  GetIndicateursPourConseillerQuery,
  Result<IndicateursPourConseillerQueryModel>
> {
  constructor(
    private dateService: DateService,
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
    query: GetIndicateursPourConseillerQuery
  ): Promise<Result<IndicateursPourConseillerQueryModel>> {
    const maintenant = this.dateService.nowJs()
    const exclureFavoris = query.exclure ? query.exclure.offresEtFavoris : false

    const [
      actionsSqlDuJeune,
      rendezVousSqlDuJeune,
      offresEtFavorisEvenementsSql
    ] = await Promise.all([
      findAllActions(query),
      findAllRendezVous(query),
      exclureFavoris ? Promise.resolve([]) : findAllFavoris(query)
    ])

    const indicateursActions = this.getIndicateursActions(
      actionsSqlDuJeune,
      query.dateDebut,
      query.dateFin,
      maintenant
    )

    const nombreRendezVousPlanifies = rendezVousSqlDuJeune.length

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
    return actionsSqlDuJeune
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
  }

  private getIndicateursOffresEtFavoris(
    evenementsSql: EvenementEngagementHebdoSqlModel[]
  ): {
    offres: { consultees: number; partagees: number }
    favoris: { offresSauvegardees: number; recherchesSauvegardees: number }
  } {
    const codesOffreConsultee: string[] = [
      Evenement.Code.OFFRE_ALTERNANCE_AFFICHEE,
      Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
      Evenement.Code.OFFRE_IMMERSION_AFFICHEE,
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHE,
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHEE
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

    return evenementsSql
      .map(evenementSql => {
        return {
          offres: {
            consultees: codesOffreConsultee.includes(evenementSql.code) ? 1 : 0,
            partagees:
              evenementSql.code === Evenement.Code.MESSAGE_OFFRE_PARTAGEE
                ? 1
                : 0
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
  }

  private lActionEstTermineeEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return (
      actionSql.statut === Action.Statut.TERMINEE &&
      actionSql.dateFinReelle !== null &&
      DateService.isBetweenDates(actionSql.dateFinReelle, dateDebut, dateFin)
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
  return RendezVousSqlModel.findAll({
    where: {
      date: { [Op.between]: [query.dateDebut, query.dateFin] }
    },
    include: [
      {
        model: JeuneSqlModel,
        where: { id: query.idJeune }
      }
    ]
  })
}

function findAllFavoris(
  query: GetIndicateursPourConseillerQuery
): Promise<EvenementEngagementHebdoSqlModel[]> {
  return EvenementEngagementHebdoSqlModel.findAll({
    where: {
      typeUtilisateur: Authentification.Type.JEUNE,
      idUtilisateur: query.idJeune,
      dateEvenement: { [Op.between]: [query.dateDebut, query.dateFin] }
    }
  })
}
