import { DateTime } from 'luxon'
import { Injectable } from '@nestjs/common'
import { IdService } from '../../utils/id-service'
import { DateService } from '../../utils/date-service'

export const ListeDeDiffusionRepositoryToken = 'ListeDeDiffusion.Repository'

export interface ListeDeDiffusion {
  id: string
  idConseiller: string
  titre: string
  dateDeCreation: DateTime
  beneficiaires: ListeDeDiffusion.Beneficiaire[]
}

export namespace ListeDeDiffusion {
  export interface InfosCreation {
    idConseiller: string
    titre: string
    idsBeneficiaires: string[]
  }

  export interface Repository {
    save(listeDeDiffusion: ListeDeDiffusion): Promise<void>

    get(id: string): Promise<ListeDeDiffusion | undefined>
  }

  export interface Beneficiaire {
    id: string
    dateAjout: DateTime
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}

    creer(infosCreation: InfosCreation): ListeDeDiffusion {
      const maintenant = this.dateService.now()
      const beneficiaires: Beneficiaire[] = infosCreation.idsBeneficiaires.map(
        idBeneficiaire => ({
          id: idBeneficiaire,
          dateAjout: maintenant
        })
      )
      return {
        id: this.idService.uuid(),
        idConseiller: infosCreation.idConseiller,
        titre: infosCreation.titre,
        dateDeCreation: maintenant,
        beneficiaires
      }
    }
  }
}
