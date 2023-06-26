import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { DateTime } from 'luxon'
import { Op, WhereOptions } from 'sequelize'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { ArchiveJeuneSqlModel } from '../../infrastructure/sequelize/models/archive-jeune.sql-model'
import { EvenementEngagementHebdoSqlModel } from '../../infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { LogApiPartenaireSqlModel } from '../../infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SuiviJobSqlModel } from '../../infrastructure/sequelize/models/suivi-job.sql-model'
import { DateService } from '../../utils/date-service'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import Source = RendezVous.Source

@Injectable()
@ProcessJobType(Planificateur.JobType.NETTOYER_LES_DONNEES)
export class HandleJobNettoyerLesDonneesCommandHandler extends JobHandler<Job> {
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
    let nombreEvenementsEngagementHebdoSupprimes = -1
    let nombreSuiviJobsSupprimes = -1
    let nombreRdvSupprimes = -1
    let nombreRdvMiloSupprimes = -1

    try {
      nombreArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
        where: dateArchivageSuperieureADeuxAns(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreLogsApiSupprimes = await LogApiPartenaireSqlModel.destroy({
        where: dateSuperieureAUnMois(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreEvenementsEngagementHebdoSupprimes =
        await EvenementEngagementHebdoSqlModel.destroy({
          where: dateEvenementSuperieureAUneSemaine(maintenant)
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
        where: dateSuppressionSuperieureASixMois(maintenant)
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
        nombreEvenementsEngagementHebdoSupprimes,
        nombreSuiviJobsSupprimes,
        nombreRdvSupprimes,
        nombreRdvMiloSupprimes
      }
    }
  }
}

function dateArchivageSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    dateArchivage: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateSuperieureAUnMois(maintenant: DateTime): WhereOptions {
  return {
    date: { [Op.lt]: maintenant.minus({ month: 1 }).toJSDate() }
  }
}

function dateEvenementSuperieureAUneSemaine(
  maintenant: DateTime
): WhereOptions {
  return {
    dateEvenement: { [Op.lt]: maintenant.minus({ week: 1 }).toJSDate() }
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

function dateSuppressionSuperieureASixMois(maintenant: DateTime): WhereOptions {
  return {
    dateSuppression: { [Op.lt]: maintenant.minus({ months: 6 }).toJSDate() }
  }
}
