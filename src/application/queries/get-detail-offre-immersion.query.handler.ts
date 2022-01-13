import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'
import { DetailOffreImmersionQueryModel } from './query-models/offres-immersion.query-models'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'

export interface GetDetailOffreImmersionQuery extends Query {
  idOffreImmersion: string
}

@Injectable()
export class GetDetailOffreImmersionQueryHandler extends QueryHandler<
  GetDetailOffreImmersionQuery,
  Result<DetailOffreImmersionQueryModel>
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository,
    private evenementService: EvenementService
  ) {
    super('GetDetailOffreImmersionQueryHandler')
  }

  async handle(
    query: GetDetailOffreImmersionQuery
  ): Promise<Result<DetailOffreImmersionQueryModel>> {
    return this.offresImmersionRepository.get(query.idOffreImmersion)
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailOffreImmersionQuery
  ): Promise<void> {
    return
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_IMMERSION_AFFICHEE,
      utilisateur
    )
  }
}
