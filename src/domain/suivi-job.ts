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
  messageDErreur?: string
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
