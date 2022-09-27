import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { DetailOffreImmersionQueryModel } from './query-models/offres-immersion.query-model'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { PartenaireImmersion } from '../../infrastructure/repositories/dto/immersion.dto'
import { toDetailOffreImmersionQueryModel } from '../../infrastructure/repositories/mappers/offres-immersion.mappers'
import {
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve
} from '../../building-blocks/types/domain-error'
import { ImmersionClient } from '../../infrastructure/clients/immersion-client'

export interface GetDetailOffreImmersionQuery extends Query {
  idOffreImmersion: string
}

@Injectable()
export class GetDetailOffreImmersionQueryHandler extends QueryHandler<
  GetDetailOffreImmersionQuery,
  Result<DetailOffreImmersionQueryModel>
> {
  constructor(private immersionClient: ImmersionClient) {
    super('GetDetailOffreImmersionQueryHandler')
  }

  async handle(
    query: GetDetailOffreImmersionQuery
  ): Promise<Result<DetailOffreImmersionQueryModel>> {
    try {
      const response = await this.immersionClient.get<PartenaireImmersion.Dto>(
        `/get-immersion-by-id/${query.idOffreImmersion}`
      )
      return success(toDetailOffreImmersionQueryModel(response.data))
    } catch (e) {
      if (e.response?.status === 404) {
        const message = `Offre d'immersion ${query.idOffreImmersion} not found`
        return failure(new RechercheDetailOffreNonTrouve(message))
      }
      if (e.response?.status === 400) {
        return failure(
          new RechercheDetailOffreInvalide(e.response.data.errors.message)
        )
      }
      throw e
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
