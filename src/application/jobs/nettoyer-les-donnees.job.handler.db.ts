import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { DateTime } from 'luxon'
import { Op, QueryTypes, Sequelize, WhereOptions } from 'sequelize'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'
import { JobHandler } from '../../building-blocks/types/job-handler'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import {
  RendezVous,
  TYPES_ANIMATIONS_COLLECTIVES
} from '../../domain/rendez-vous/rendez-vous'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { ArchiveJeuneSqlModel } from '../../infrastructure/sequelize/models/archive-jeune.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SuiviJobSqlModel } from '../../infrastructure/sequelize/models/suivi-job.sql-model'
import { DateService } from '../../utils/date-service'
import Source = RendezVous.Source
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'

@Injectable()
@ProcessJobType(Planificateur.JobType.NETTOYER_LES_DONNEES)
export class NettoyerLesDonneesJobHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository
  ) {
    super(Planificateur.JobType.NETTOYER_LES_DONNEES, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    let nbErreurs = 0
    let nombreJeunesSupprimes = -1
    let nombreJeunesSupprimesConseillerInactif = -1
    let nombreConseillersSupprimes = -1
    let nombreArchivesSupprimees = -1
    let nombreLogsApiSupprimes = -1
    let nombreSuiviJobsSupprimes = -1
    let nombreRdvSupprimes = -1
    let nombreRdvMiloSupprimes = -1
    let nombreJeunesPasConnectesDepuis60Jours = -1
    let nombreActionsSupprimees = -1
    let nombreAnimationsCollectivesCloses = -1
    let nombreFavrisEmploiSupprimes = -1
    let nombreFavrisImmersionSupprimes = -1
    let nombreFavrisEngagementSupprimes = -1

    try {
      const jeunes = await JeuneSqlModel.findAll({
        where: dateDerniereConnexionSuperieureADeuxAns(maintenant),
        attributes: ['id']
      })
      this.nettoyerJeunes(jeunes)
      nombreJeunesSupprimes = await JeuneSqlModel.destroy({
        where: dateDerniereConnexionSuperieureADeuxAns(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      const idsConseillers = (
        await ConseillerSqlModel.findAll({
          where: dateDerniereConnexionSuperieureADeuxAns(maintenant),
          attributes: ['id']
        })
      ).map(conseiller => conseiller.id)

      const jeunesDuConseiller = await JeuneSqlModel.findAll({
        where: {
          idConseiller: { [Op.in]: idsConseillers }
        },
        attributes: ['id']
      })
      this.nettoyerJeunes(jeunesDuConseiller)
      nombreJeunesSupprimesConseillerInactif = await JeuneSqlModel.destroy({
        where: { id: { [Op.in]: jeunesDuConseiller.map(jeune => jeune.id) } }
      })

      await JeuneSqlModel.update(
        { idConseillerInitial: null },
        {
          where: {
            idConseillerInitial: { [Op.in]: idsConseillers }
          }
        }
      )

      for (const idConseiller of idsConseillers) {
        await this.authentificationRepository.deleteUtilisateurIdp(idConseiller)
      }
      nombreConseillersSupprimes = await ConseillerSqlModel.destroy({
        where: dateDerniereConnexionSuperieureADeuxAns(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
        where: dateArchivageSuperieureADeuxAns(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreLogsApiSupprimes = await LogApiPartenaireSqlModel.destroy({
        where: dateSuperieureADeuxSemaines(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreSuiviJobsSupprimes = await SuiviJobSqlModel.destroy({
        where: dateExecutionSuperieureADeuxJours(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreRdvMiloSupprimes = await RendezVousSqlModel.destroy({
        where: dateSuperieureATroisMoisEtVenantDeMilo(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreRdvSupprimes = await RendezVousSqlModel.destroy({
        where: dateSuperieureADeuxAns(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreJeunesPasConnectesDepuis60Jours = (
        await JeuneSqlModel.update(
          {
            pushNotificationToken: null
          },
          {
            where: dateConnexionSuperieureA60Jours(maintenant)
          }
        )
      )[0]
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      nombreActionsSupprimees = await ActionSqlModel.destroy({
        where: dateEcheanceSuperieureADeuxAns(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    // Favoris
    try {
      nombreFavrisEmploiSupprimes = await FavoriOffreEmploiSqlModel.destroy({
        where: dateCreationSuperieureASixMois(maintenant)
      })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }
    try {
      nombreFavrisEngagementSupprimes =
        await FavoriOffreEngagementSqlModel.destroy({
          where: dateCreationSuperieureASixMois(maintenant)
        })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }
    try {
      nombreFavrisImmersionSupprimes =
        await FavoriOffreImmersionSqlModel.destroy({
          where: dateCreationSuperieureASixMois(maintenant)
        })
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    try {
      const animationsCollectivesPasseesSansInscrit: Array<{ id: string }> =
        await this.sequelize.query(
          `SELECT rendez_vous.id
            FROM rendez_vous
            LEFT OUTER JOIN rendez_vous_jeune_association
            ON rendez_vous_jeune_association.id_rendez_vous = rendez_vous.id
            WHERE rendez_vous.type IN (:typesAC)
                AND rendez_vous.date_cloture IS null
                AND rendez_vous.date < :aujourdhui
            GROUP BY rendez_vous.id
          HAVING COUNT(rendez_vous_jeune_association.id_rendez_vous) = 0`,
          {
            type: QueryTypes.SELECT,
            replacements: {
              typesAC: TYPES_ANIMATIONS_COLLECTIVES,
              aujourdhui: maintenant.startOf('day').toJSDate()
            }
          }
        )

      nombreAnimationsCollectivesCloses = (
        await RendezVousSqlModel.update(
          { dateCloture: maintenant.toJSDate() },
          {
            where: {
              id: {
                [Op.in]: animationsCollectivesPasseesSansInscrit.map(
                  ({ id }) => id
                )
              }
            }
          }
        )
      )[0]
    } catch (e) {
      this.logger.warn(e)
      nbErreurs++
    }

    return {
      jobType: this.jobType,
      nbErreurs,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {
        nombreJeunesSupprimes,
        nombreJeunesSupprimesConseillerInactif,
        nombreConseillersSupprimes,
        nombreArchivesSupprimees,
        nombreLogsApiSupprimees: nombreLogsApiSupprimes,
        nombreSuiviJobsSupprimes,
        nombreRdvSupprimes,
        nombreRdvMiloSupprimes,
        nombreJeunesPasConnectesDepuis60Jours,
        nombreActionsSupprimees,
        nombreAnimationsCollectivesCloses,
        nombreFavrisEmploiSupprimes,
        nombreFavrisEngagementSupprimes,
        nombreFavrisImmersionSupprimes
      }
    }
  }

  private async nettoyerJeunes(
    jeunes: Array<Pick<JeuneSqlModel, 'id'>>
  ): Promise<void> {
    for (const jeune of jeunes) {
      await this.authentificationRepository.deleteUtilisateurIdp(jeune.id)
      this.chatRepository.supprimerChat(jeune.id)
    }
  }
}

function dateDerniereConnexionSuperieureADeuxAns(
  maintenant: DateTime
): WhereOptions {
  return {
    dateDerniereConnexion: {
      [Op.lt]: maintenant.minus({ years: 2 }).toJSDate()
    }
  }
}

function dateArchivageSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    dateArchivage: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateSuperieureADeuxSemaines(maintenant: DateTime): WhereOptions {
  return {
    date: { [Op.lt]: maintenant.minus({ week: 2 }).toJSDate() }
  }
}

function dateExecutionSuperieureADeuxJours(maintenant: DateTime): WhereOptions {
  return {
    dateExecution: { [Op.lt]: maintenant.minus({ days: 2 }).toJSDate() }
  }
}

function dateSuperieureATroisMoisEtVenantDeMilo(
  maintenant: DateTime
): WhereOptions {
  return {
    date: { [Op.lt]: maintenant.minus({ months: 3 }).toJSDate() },
    source: Source.MILO
  }
}

function dateCreationSuperieureASixMois(maintenant: DateTime): WhereOptions {
  return {
    dateCreation: { [Op.lte]: maintenant.minus({ months: 6 }).toJSDate() }
  }
}

function dateSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    date: { [Op.lte]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateConnexionSuperieureA60Jours(maintenant: DateTime): WhereOptions {
  return {
    dateDerniereConnexion: {
      [Op.lt]: maintenant.minus({ days: 60 }).toJSDate()
    },
    pushNotificationToken: {
      [Op.ne]: null
    }
  }
}

function dateEcheanceSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    date_echeance: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}
