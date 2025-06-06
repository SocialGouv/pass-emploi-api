import { AsyncLocalStorage } from 'node:async_hooks'
import { v4 as uuidV4 } from 'uuid'

let workerTrackingServiceInstance: WorkerTrackingService

export interface JobTracking {
  name?: string
  currentTraceIds: { transaction?: { id: string } }
}

export class WorkerTrackingService {
  private asyncLocalStorage = new AsyncLocalStorage()

  getCurrentJobTracking(): JobTracking {
    const emptyStore = {
      currentTraceIds: {}
    }
    const jobTracking: JobTracking =
      this.asyncLocalStorage.getStore() as JobTracking
    return jobTracking ?? emptyStore
  }

  startJobTracking(name: string): void {
    const currentTraceIds = {
      transaction: { id: uuidV4() }
    }
    const jobTracking: JobTracking = {
      name,
      currentTraceIds
    }
    this.asyncLocalStorage.enterWith(jobTracking)
  }
}

export function getWorkerTrackingServiceInstance(): WorkerTrackingService {
  if (workerTrackingServiceInstance == null) {
    workerTrackingServiceInstance = new WorkerTrackingService()
  }
  return workerTrackingServiceInstance
}
