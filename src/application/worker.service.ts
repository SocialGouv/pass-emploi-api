/* eslint-disable no-console */

import { Injectable } from '@nestjs/common'

@Injectable()
export class WorkerService {
  subscribe(): void {
    setInterval(() => {
      console.log('PLOP')
    }, 10000)
  }
}
