import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { ServiceCiviqueQueryModel } from './query-models/service-civique.query-model'
import { FindAllOffresServicesCiviqueQueryGetter } from './query-getters/find-all-offres-services-civique.query.getter'

export interface GetServicesCiviqueQuery extends Query {
  page?: number
  limit?: number
  lat?: number
  lon?: number
  distance?: number
  dateDeDebutMinimum?: string
  dateDeDebutMaximum?: string
  domaine?: string
  dateDeCreationMinimum?: string
}

@Injectable()
export class GetServicesCiviqueQueryHandler extends QueryHandler<
  GetServicesCiviqueQuery,
  Result<ServiceCiviqueQueryModel[]>
> {
  constructor(
    private findAllOffresServicesCiviqueQueryGetter: FindAllOffresServicesCiviqueQueryGetter,
    private evenementService: EvenementService
  ) {
    super('GetServicesCiviqueQueryHandler')
  }

  async handle(
    query: GetServicesCiviqueQuery
  ): Promise<Result<ServiceCiviqueQueryModel[]>> {
    const result = await this.findAllOffresServicesCiviqueQueryGetter.handle(
      query
    )

    if (isFailure(result)) {
      return result
    }

    const offresQueryModel: ServiceCiviqueQueryModel[] = result.data.map(
      offre => ({
        id: offre.id,
        titre: offre.titre,
        organisation: offre.organisation,
        ville: offre.ville,
        domaine: offre.domaine,
        dateDeDebut: offre.dateDeDebut
      })
    )

    return success(offresQueryModel)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.SERVICE_CIVIQUE_RECHERCHE,
      utilisateur
    )
  }
}
