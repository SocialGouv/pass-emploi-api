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
import { OffreImmersionQueryModel } from './query-models/offres-immersion.query-models'

export interface GetOffresImmersionQuery extends Query {
  rome: string
  lat: number
  lon: number
  distance?: number
}

const DISTANCE_PAR_DEFAUT = 30

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
    const distance = query.distance ? query.distance : DISTANCE_PAR_DEFAUT
    return await this.offresImmersionRepository.findAll(
      query.rome,
      query.lat,
      query.lon,
      distance
    )
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
