import { Injectable } from '@nestjs/common'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { DemarcheQueryModel } from './query-models/actions.query-model'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'

export interface GetDemarchesQuery extends Query {
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetDemarchesQueryHandler extends QueryHandler<
  GetDemarchesQuery,
  Result<DemarcheQueryModel[]>
> {
  constructor(
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer
  ) {
    super('GetDemarchesQueryHandler')
  }

  async handle(
    query: GetDemarchesQuery
  ): Promise<Result<DemarcheQueryModel[]>> {
    return this.getDemarchesQueryGetter.handle({
      ...query,
      tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
    })
  }

  async authorize(
    query: GetDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
