import { DateTime } from 'luxon'
import { Planificateur } from './planificateur'
import JobType = Planificateur.JobType

export const SuiviJobServiceToken = 'SuiviJob.Service'

export interface SuiviJob {
  jobType: JobType
  dateExecution: DateTime
  succes: boolean
  resultat: unknown
  nbErreurs: number
  tempsExecution: number
  erreur?: { stack?: string; message?: string }
}

export interface RapportJob24h {
  jobType: Planificateur.JobType
  nbExecutionsAttendues: number
  nbExecutions: number
  nbErreurs: number
  nbEchecs: number
}

export interface NettoyageJobsStats {
  nbJobsNettoyes: number
  tempsDExecution?: number
}

export namespace SuiviJob {
  export interface Service {
    notifierResultatJob(suiviJob: SuiviJob): Promise<void>
    envoyerRapport(rapportJobs: RapportJob24h[]): Promise<void>
    save(suiviJob: SuiviJob): Promise<void>
  }
}

export function estJobSuivi(jobType: Planificateur.JobType): boolean {
  return ![
    Planificateur.JobType.MONITORER_JOBS,
    Planificateur.JobType.RENDEZVOUS,
    Planificateur.JobType.RAPPEL_SESSION,
    Planificateur.JobType.RAPPEL_ACTION,
    Planificateur.JobType.TRAITER_EVENEMENT_MILO,
    Planificateur.JobType.RECUPERER_ANALYSE_ANTIVIRUS
  ].includes(jobType)
}
export function estNotifiable(suiviJob: SuiviJob): boolean {
  return (
    suiviJob.succes === false ||
    ![
      Planificateur.JobType.MONITORER_JOBS,
      Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO,
      Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE,
      Planificateur.JobType.RENDEZVOUS,
      Planificateur.JobType.RAPPEL_SESSION,
      Planificateur.JobType.RAPPEL_ACTION,
      Planificateur.JobType.TRAITER_EVENEMENT_MILO
    ].includes(suiviJob.jobType)
  )
}
