import { Injectable } from '@nestjs/common'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estPoleEmploiOuCD, peutVoirLesCampagnes } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { GetCampagneQueryGetter } from './query-getters/get-campagne.query.getter'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { CampagneQueryModel } from './query-models/campagne.query-model'
import { JeuneHomeDemarcheQueryModel } from './query-models/home-jeune.query-model'

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
    private getCampagneQueryGetter: GetCampagneQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetJeuneHomeDemarchesQueryHandler')
  }

  async handle(
    query: GetJeuneHomeDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<Cached<JeuneHomeDemarcheQueryModel>>> {
    const getCampagne = (): Promise<CampagneQueryModel | undefined> =>
      peutVoirLesCampagnes(utilisateur.structure)
        ? this.getCampagneQueryGetter.handle({ idJeune: query.idJeune })
        : Promise.resolve(undefined)

    const [demarches, campagne] = await Promise.all([
      this.getActionsJeunePoleEmploiQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
      }),
      getCampagne()
    ])

    if (isFailure(demarches)) {
      return demarches
    }

    const data: Cached<JeuneHomeDemarcheQueryModel> = {
      queryModel: {
        actions: demarches.data.queryModel,
        campagne
      },
      dateDuCache: demarches.data.dateDuCache
    }
    return success(data)
  }

  async authorize(
    query: GetJeuneHomeDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploiOuCD(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
