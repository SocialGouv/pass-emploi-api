import { DateTime } from 'luxon'
import { Inject, Injectable } from '@nestjs/common'
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

  interface InfosMiseAJour {
    titre: string
    idsBeneficiaires: string[]
  }

  export interface Repository {
    save(listeDeDiffusion: ListeDeDiffusion): Promise<void>

    get(id: string): Promise<ListeDeDiffusion | undefined>

    findAll(ids: string[]): Promise<ListeDeDiffusion[]>

    delete(id: string): Promise<void>

    findAllByConseiller(idConseiller: string): Promise<ListeDeDiffusion[]>
  }

  export interface Beneficiaire {
    id: string
    dateAjout: DateTime
    estDansLePortefeuille: boolean
  }

  export function getBeneficiairesDuPortefeuille(
    listeDeDiffusion: ListeDeDiffusion
  ): ListeDeDiffusion.Beneficiaire[] {
    return listeDeDiffusion.beneficiaires.filter(
      beneficiaire => beneficiaire.estDansLePortefeuille
    )
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
          dateAjout: maintenant,
          estDansLePortefeuille: true
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

  @Injectable()
  export class Service {
    constructor(
      private dateService: DateService,
      @Inject(ListeDeDiffusionRepositoryToken)
      private repository: Repository
    ) {}

    mettreAJour(
      listeDeDiffusionInitiale: ListeDeDiffusion,
      infosMiseAJour: InfosMiseAJour
    ): ListeDeDiffusion {
      const maintenant = this.dateService.now()

      const beneficiairesInitiaux: Beneficiaire[] =
        listeDeDiffusionInitiale.beneficiaires.filter(beneficiaire =>
          infosMiseAJour.idsBeneficiaires.includes(beneficiaire.id)
        )

      const nouveauxBeneficiaires: Beneficiaire[] =
        infosMiseAJour.idsBeneficiaires
          .filter(
            id =>
              !listeDeDiffusionInitiale.beneficiaires.find(
                beneficiaire => beneficiaire.id === id
              )
          )
          .map(idBeneficiaire => ({
            id: idBeneficiaire,
            dateAjout: maintenant,
            estDansLePortefeuille: true
          }))

      return {
        ...listeDeDiffusionInitiale,
        beneficiaires: beneficiairesInitiaux.concat(nouveauxBeneficiaires),
        titre: infosMiseAJour.titre
      }
    }

    async enleverLesJeunesDuConseiller(
      idConseiller: string,
      idsJeunes: string[]
    ): Promise<void> {
      const listesDeDiffusion = await this.repository.findAllByConseiller(
        idConseiller
      )

      for (const listeDeDiffusion of listesDeDiffusion) {
        const listeDeDiffusionSansLesBeneficiaires = {
          ...listeDeDiffusion,
          beneficiaires: listeDeDiffusion.beneficiaires.filter(
            beneficiaire => !idsJeunes.includes(beneficiaire.id)
          )
        }
        if (
          listeDeDiffusion.beneficiaires.length !==
          listeDeDiffusionSansLesBeneficiaires.beneficiaires.length
        ) {
          await this.repository.save(listeDeDiffusionSansLesBeneficiaires)
        }
      }
    }
  }
}
