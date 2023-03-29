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
import { SuiviJobSqlModel } from '../../infrastructure/sequelize/models/suivi-job.sql-model'
import { DateService } from '../../utils/date-service'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'

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
    let nombreJeunesArchivesSupprimees = -1
    let nombreRdvArchivesSupprimees = -1
    let nombreLogsApiSupprimees = -1
    let nombreSuiviJobsSupprimees = -1

    try {
      nombreJeunesArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
        where: dateArchivageSuperieureADeuxAns(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreRdvArchivesSupprimees = await RendezVousSqlModel.destroy({
        where: dateArchivageSuperieureASixMois(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreLogsApiSupprimees = await LogApiPartenaireSqlModel.destroy({
        where: dateSuperieureAUnMois(maintenant)
      })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreSuiviJobsSupprimees =
        await EvenementEngagementHebdoSqlModel.destroy({
          where: dateEvenementSuperieureAUneSemaine(maintenant)
        })
    } catch (_e) {
      nbErreurs++
    }

    try {
      nombreSuiviJobsSupprimees = await SuiviJobSqlModel.destroy({
        where: dateExecutionSuperieureADeuxJours(maintenant)
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
        nombreJeunesArchivesSupprimees: nombreJeunesArchivesSupprimees,
        nombreRdvArchivesSupprimees: nombreRdvArchivesSupprimees,
        nombreLogsApiSupprimees,
        nombreEvenementsEngagementSupprimees: nombreSuiviJobsSupprimees
      }
    }
  }
}

function dateArchivageSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    dateArchivage: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateArchivageSuperieureASixMois(maintenant: DateTime): WhereOptions {
  return {
    dateSuppression: { [Op.lt]: maintenant.minus({ months: 6 }).toJSDate() }
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
