import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { OffreImmersionQueryModel } from './query-models/offres-immersion.query-model'
import { FindAllOffresImmersionQueryGetter } from './query-getters/find-all-offres-immersion.query.getter.db'

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
    return this.findAllOffresImmersionQueryGetter.handle(query)
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_IMMERSION_RECHERCHEE,
      utilisateur
    )
  }
}
