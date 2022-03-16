import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { RendezVous, RendezVousRepositoryToken } from 'src/domain/rendez-vous'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetDetailRendezVousQuery extends Query {
  idRendezVous: string
}

@Injectable()
export class GetDetailRendezVousQueryHandler extends QueryHandler<
  GetDetailRendezVousQuery,
  Result<RendezVousQueryModel>
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer
  ) {
    super('GetDetailRendezVousQueryHandler')
  }

  async handle(
    query: GetDetailRendezVousQuery
  ): Promise<Result<RendezVousQueryModel>> {
    const rendezVousQueryModel =
      await this.rendezVousRepository.getQueryModelById(query.idRendezVous)

    if (!rendezVousQueryModel) {
      return failure(new NonTrouveError('RendezVous', query.idRendezVous))
    }
    return success(rendezVousQueryModel)
  }

  async authorize(
    query: GetDetailRendezVousQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.rendezVousAuthorizer.authorize(query.idRendezVous, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
