import { Injectable } from '@nestjs/common'
import { JeuneHomeDemarcheQueryModel } from './query-models/home-jeune.query-model'
import { GetCampagneQueryModel } from './query-getters/get-campagne.query.getter'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Authentification } from '../../domain/authentification'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'

export interface GetJeuneHomeDemarchesQuery extends Query {
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetJeuneHomeDemarchesQueryHandler extends QueryHandler<
  GetJeuneHomeDemarchesQuery,
  Result<Cached<JeuneHomeDemarcheQueryModel>>
> {
  constructor(
    private getActionsJeunePoleEmploiQueryGetter: GetDemarchesQueryGetter,
    private getCampagneQueryModel: GetCampagneQueryModel,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer
  ) {
    super('GetJeuneHomeDemarchesQueryHandler')
  }

  async handle(
    query: GetJeuneHomeDemarchesQuery
  ): Promise<Result<Cached<JeuneHomeDemarcheQueryModel>>> {
    const [demarches, campagne] = await Promise.all([
      this.getActionsJeunePoleEmploiQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
      }),
      this.getCampagneQueryModel.handle({ idJeune: query.idJeune })
    ])

    if (isFailure(demarches)) {
      return demarches
    }

    const data: Cached<JeuneHomeDemarcheQueryModel> = {
      queryModel: {
        actions: demarches.data.queryModel,
        campagne: campagne
      },
      dateDuCache: demarches.data.dateDuCache
    }
    return success(data)
  }

  async authorize(
    query: GetJeuneHomeDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
