import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { DateTime } from 'luxon'
import { Op, WhereOptions } from 'sequelize'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { ArchiveJeuneSqlModel } from '../../infrastructure/sequelize/models/archive-jeune.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SuiviJobSqlModel } from '../../infrastructure/sequelize/models/suivi-job.sql-model'
import { DateService } from '../../utils/date-service'
import Source = RendezVous.Source

@Injectable()
@ProcessJobType(Planificateur.JobType.NETTOYER_LES_DONNEES)
export class NettoyerLesDonneesJobHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.NETTOYER_LES_DONNEES, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    let nbErreurs = 0
    let nombreArchivesSupprimees = -1
    let nombreLogsApiSupprimes = -1
    let nombreSuiviJobsSupprimes = -1
    let nombreRdvSupprimes = -1
    let nombreRdvMiloSupprimes = -1
    let nombreJeunesPasConnectesDepuis60Jours = -1
    let nombreActionsSupprimees = -1

    try {
      nombreArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
        where: dateArchivageSuperieureADeuxAns(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreLogsApiSupprimes = await LogApiPartenaireSqlModel.destroy({
        where: dateSuperieureAUneSemaine(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreSuiviJobsSupprimes = await SuiviJobSqlModel.destroy({
        where: dateExecutionSuperieureADeuxJours(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreRdvMiloSupprimes = await RendezVousSqlModel.destroy({
        where: dateSuperieureATroisMoisEtVenantDeMilo(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreRdvSupprimes = await RendezVousSqlModel.destroy({
        where: dateSuppressionSuperieureATroisMois(maintenant)
      })
    } catch (_e) {
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
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreActionsSupprimees = await ActionSqlModel.destroy({
        where: dateEcheanceSuperieureADeuxAns(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    return {
      jobType: this.jobType,
      nbErreurs,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {
        nombreArchivesSupprimees,
        nombreLogsApiSupprimees: nombreLogsApiSupprimes,
        nombreSuiviJobsSupprimes,
        nombreRdvSupprimes,
        nombreRdvMiloSupprimes,
        nombreJeunesPasConnectesDepuis60Jours,
        nombreActionsSupprimees
      }
    }
  }
}

function dateArchivageSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    dateArchivage: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateSuperieureAUneSemaine(maintenant: DateTime): WhereOptions {
  return {
    date: { [Op.lt]: maintenant.minus({ week: 1 }).toJSDate() }
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

function dateSuppressionSuperieureATroisMois(
  maintenant: DateTime
): WhereOptions {
  return {
    dateSuppression: { [Op.lt]: maintenant.minus({ months: 3 }).toJSDate() }
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
