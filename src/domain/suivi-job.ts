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
  listeJobsNettoyes: Array<{ id: string; type: string }>
  nbErreurs: number
  listeErreurs: Array<{ id: string; type: string }>
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
  return ![Planificateur.JobType.MONITORER_JOBS].includes(jobType)
}
export function estNotifiable(suiviJob: SuiviJob): boolean {
  return (
    suiviJob.succes === false ||
    ![
      Planificateur.JobType.MONITORER_JOBS,
      Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO,
      Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE
    ].includes(suiviJob.jobType)
  )
}
