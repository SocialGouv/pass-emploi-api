import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'
import { OffreImmersionQueryModel } from './query-models/offres-immersion.query-model'

export interface GetOffresImmersionQuery extends Query {
  rome: string
  lat: number
  lon: number
  distance?: number
}

@Injectable()
export class GetOffresImmersionQueryHandler extends QueryHandler<
  GetOffresImmersionQuery,
  Result<OffreImmersionQueryModel[]>
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository,
    private evenementService: EvenementService
  ) {
    super('GetOffresImmersionQueryHandler')
  }

  async handle(
    query: GetOffresImmersionQuery
  ): Promise<Result<OffreImmersionQueryModel[]>> {
    const distance = query.distance
      ? query.distance
      : OffresImmersion.DISTANCE_PAR_DEFAUT
    return this.offresImmersionRepository.findAll({
      rome: query.rome,
      lat: query.lat,
      lon: query.lon,
      distance
    })
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetOffresImmersionQuery
  ): Promise<void> {
    return
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_IMMERSION_RECHERCHEE,
      utilisateur
    )
  }
}
