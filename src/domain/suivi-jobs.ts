import { DateTime } from 'luxon'
import { Result } from '../building-blocks/types/result'
import { Planificateur } from './planificateur'

export const SuiviJobsServiceToken = 'SuiviJobs.Service'

export interface ResultatJob {
  jobCommand: string
  result: Result
}

export interface RapportJob24h {
  jobType: Planificateur.JobType
  nbExecutionsAttendues: number
  nbExecutions: number
  nbErreurs: number
  nbEchecs: number
  datesExecutions: DateTime[]
}

export interface NettoyageJobsStats {
  nbJobsNettoyes: number
  listeJobsNettoyes: Array<{ id: string; type: string }>
  nbErreurs: number
  listeErreurs: Array<{ id: string; type: string }>
  tempsDExecution?: number
}

export namespace SuiviJobs {
  export interface Service {
    notifierResultatJob(resultatJob: ResultatJob): Promise<void>
    envoyerRapport(rapportJobs: RapportJob24h[]): Promise<void>
  }
}
