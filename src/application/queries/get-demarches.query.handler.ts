import { Injectable } from '@nestjs/common'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { DemarcheQueryModel } from './query-models/actions.query-model'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { Core } from '../../domain/core'

export interface GetDemarchesQuery extends Query {
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetDemarchesQueryHandler extends QueryHandler<
  GetDemarchesQuery,
  Result<Cached<DemarcheQueryModel[]>>
> {
  constructor(
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetDemarchesQueryHandler')
  }

  async handle(
    query: GetDemarchesQuery
  ): Promise<Result<Cached<DemarcheQueryModel[]>>> {
    return this.getDemarchesQueryGetter.handle({
      ...query,
      tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
    })
  }

  async authorize(
    query: GetDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      Core.structuresPoleEmploiBRSA
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
