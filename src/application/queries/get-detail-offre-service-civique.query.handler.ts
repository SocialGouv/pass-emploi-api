import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { DetailServiceCiviqueQueryModel } from './query-models/service-civique.query-model'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { toOffreEngagement } from '../../infrastructure/repositories/mappers/service-civique.mapper'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { DetailOffreEngagementDto } from '../../infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { EngagementClient } from '../../infrastructure/clients/engagement-client'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'

export interface GetDetailOffreServiceCiviqueQuery extends Query {
  idOffre: string
}

@Injectable()
export class GetDetailOffreServiceCiviqueQueryHandler extends QueryHandler<
  GetDetailOffreServiceCiviqueQuery,
  Result<DetailServiceCiviqueQueryModel>
> {
  constructor(
    private engagementClient: EngagementClient,
    private evenementService: EvenementService
  ) {
    super('GetDetailServiceCiviqueQueryHandler')
  }

  async handle(
    query: GetDetailOffreServiceCiviqueQuery
  ): Promise<Result<DetailServiceCiviqueQueryModel>> {
    try {
      const response =
        await this.engagementClient.get<DetailOffreEngagementDto>(
          `v0/mission/${query.idOffre}`
        )
      return success(toOffreEngagement(response.data.data))
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status < 500) {
        if (e.response?.status == 404) {
          const erreur = new NonTrouveError('OffreEngagement', query.idOffre)
          return failure(erreur)
        } else {
          const erreur = new ErreurHttp(
            e.response.data?.message,
            e.response.status
          )
          return failure(erreur)
        }
      }
      return failure(e)
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.evenementService.creer(
        Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHE,
        utilisateur
      )
    }
  }
}
