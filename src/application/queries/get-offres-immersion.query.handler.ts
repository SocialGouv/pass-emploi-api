import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { OffresImmersion } from '../../domain/offre-immersion'
import { OffreImmersionQueryModel } from './query-models/offres-immersion.query-model'
import { FindAllOffresImmersionQueryGetter } from './query-getters/find-all-offres-immersion.query.getter'

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
    private findAllOffresImmersionQueryGetter: FindAllOffresImmersionQueryGetter,
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
    return this.findAllOffresImmersionQueryGetter.handle({
      rome: query.rome,
      lat: query.lat,
      lon: query.lon,
      distance
    })
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_IMMERSION_RECHERCHEE,
      utilisateur
    )
  }
}
