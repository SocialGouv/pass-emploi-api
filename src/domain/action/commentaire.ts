import { Action } from './action'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'

export interface Commentaire {
  id: string
  idAction: string
  date: DateTime
  createur: Action.Createur
  message: string
}

export namespace Commentaire {
  export interface Repository {
    save(commentaire: Commentaire): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(
      private dateService: DateService,
      private idService: IdService
    ) {}

    build(
      action: Action,
      message: string,
      createur: Action.Createur
    ): Commentaire {
      return {
        id: this.idService.uuid(),
        idAction: action.id,
        date: this.dateService.now(),
        createur,
        message
      }
    }
  }
}
