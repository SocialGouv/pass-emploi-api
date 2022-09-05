import { Result } from '../building-blocks/types/result'

export const NotificationSupportServiceToken = 'NotificationSupport.Service'

export interface InfosJob {
  job: string
  result: Result
}

export interface NettoyageJobsStats {
  nbJobsNettoyes: number
  listeJobsNettoyes: Array<{ id: string; type: string }>
  nbErreurs: number
  listeErreurs: Array<{ id: string; type: string }>
  tempsDExecution?: number
}

export namespace NotificationSupport {
  export interface Service {
    notifierResultatJob(infosJob: InfosJob): Promise<void>
  }
}
