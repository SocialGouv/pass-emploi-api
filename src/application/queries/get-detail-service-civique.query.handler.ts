import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { DetailOffreEngagementQueryModel } from './query-models/service-civique.query-models'
import {
  EngagementRepositoryToken,
  OffreEngagement
} from '../../domain/offre-engagement'
import { Result } from '../../building-blocks/types/result'

export interface GetDetailServiceCiviqueQuery extends Query {
  idOffreEngagement: string
}

@Injectable()
export class GetDetailServiceCiviqueQueryHandler extends QueryHandler<
  GetDetailServiceCiviqueQuery,
  Result<DetailOffreEngagementQueryModel>
> {
  constructor(
    @Inject(EngagementRepositoryToken)
    private engagementRepository: OffreEngagement.Repository,
    private evenementService: EvenementService
  ) {
    super('GetDetailServiceCiviqueQueryHandler')
  }

  async handle(
    query: GetDetailServiceCiviqueQuery
  ): Promise<Result<DetailOffreEngagementQueryModel>> {
    return this.engagementRepository.getOffreEngagementQueryModelById(
      query.idOffreEngagement
    )
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailServiceCiviqueQuery
  ): Promise<void> {
    return
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailServiceCiviqueQuery
  ): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_SERVICE_CIVIQUE_AFFICHE,
      utilisateur
    )
  }
}
