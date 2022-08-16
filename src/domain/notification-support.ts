import { Result } from 'src/building-blocks/types/result'

export const NotificationSupportServiceToken = 'NotificationSupport.Service'

export interface InfosJob {
  job: string
  result: Result
}

export interface NettoyageJobsStats {
  jobsNettoyes: number
  erreurs: number
  tempsDExecution?: number
}

export namespace NotificationSupport {
  export interface Service {
    notifierResultatJob(infosJob: InfosJob): Promise<void>
  }
}
