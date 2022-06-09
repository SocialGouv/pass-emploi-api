import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import { OffreEmploiQueryModel } from './query-models/offres-emploi.query-model'

export interface GetDetailOffreEmploiQuery extends Query {
  idOffreEmploi: string
}

@Injectable()
export class GetDetailOffreEmploiQueryHandler extends QueryHandler<
  GetDetailOffreEmploiQuery,
  OffreEmploiQueryModel | undefined
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository
  ) {
    super('GetDetailOffreEmploiQueryHandler')
  }

  async handle(
    query: GetDetailOffreEmploiQuery
  ): Promise<OffreEmploiQueryModel | undefined> {
    return this.offresEmploiRepository.getOffreEmploiQueryModelById(
      query.idOffreEmploi
    )
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailOffreEmploiQuery
  ): Promise<void> {
    return
  }

  async monitor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    return
  }
}
