import { Injectable } from '@nestjs/common'
import { JeuneHomeDemarcheQueryModel } from './query-models/home-jeune.query-models'
import { GetActionsJeunePoleEmploiQueryHandler } from './get-actions-jeune-pole-emploi.query.handler'
import { GetCampagneQueryModel } from './campagne/get-campagne.query.handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Authentification } from '../../domain/authentification'

export interface GetJeuneHomeDemarchesQuery extends Query {
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetJeuneHomeDemarchesQueryHandler extends QueryHandler<
  GetJeuneHomeDemarchesQuery,
  Result<JeuneHomeDemarcheQueryModel>
> {
  constructor(
    private getActionsJeunePoleEmploiQueryHandler: GetActionsJeunePoleEmploiQueryHandler,
    private getCampagneQueryModel: GetCampagneQueryModel,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer
  ) {
    super('GetJeuneHomeDemarchesQueryHandler')
  }

  async handle(
    query: GetJeuneHomeDemarchesQuery
  ): Promise<Result<JeuneHomeDemarcheQueryModel>> {
    const [demarches, campagne] = await Promise.all([
      this.getActionsJeunePoleEmploiQueryHandler.handle(query),
      this.getCampagneQueryModel.handle({ idJeune: query.idJeune })
    ])

    if (isFailure(demarches)) {
      return demarches
    }

    return success({
      actions: demarches.data,
      campagne: campagne
    })
  }

  async authorize(
    query: GetJeuneHomeDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
