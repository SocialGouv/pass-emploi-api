import { DateTime } from 'luxon'
import { Injectable } from '@nestjs/common'
import { IdService } from '../../utils/id-service'
import { DateService } from '../../utils/date-service'

export interface ListeDeDiffusion {
  id: string
  idConseiller: string
  titre: string
  dateDeCreation: DateTime
  idsBeneficiaires: string[]
}

export namespace ListeDeDiffusion {
  export type InfosCreation = Pick<
    ListeDeDiffusion,
    'idConseiller' | 'titre' | 'idsBeneficiaires'
  >

  export interface Repository {
    save(listeDeDiffusion: ListeDeDiffusion): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}
    creer(infosCreation: InfosCreation): ListeDeDiffusion {
      return {
        id: this.idService.uuid(),
        idConseiller: infosCreation.idConseiller,
        titre: infosCreation.titre,
        dateDeCreation: this.dateService.now(),
        idsBeneficiaires: infosCreation.idsBeneficiaires
      }
    }
  }
}
