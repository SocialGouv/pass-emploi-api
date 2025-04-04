import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { DetailOffreImmersionQueryModel } from './query-models/offres-immersion.query-model'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { toDetailOffreImmersionQueryModel } from '../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { ImmersionClient } from '../../infrastructure/clients/immersion-client'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Authentification } from '../../domain/authentification'

export interface GetDetailOffreImmersionQuery extends Query {
  idOffreImmersion: string
}

@Injectable()
export class GetDetailOffreImmersionQueryHandler extends QueryHandler<
  GetDetailOffreImmersionQuery,
  Result<DetailOffreImmersionQueryModel>
> {
  constructor(
    private immersionClient: ImmersionClient,
    private evenementService: EvenementService
  ) {
    super('GetDetailOffreImmersionQueryHandler')
  }

  async handle(
    query: GetDetailOffreImmersionQuery
  ): Promise<Result<DetailOffreImmersionQueryModel>> {
    const paramsRechercheOffreImmersion = buildParamsRechercheImmersion(
      query.idOffreImmersion
    )

    const response = await this.immersionClient.getDetailOffre(
      paramsRechercheOffreImmersion
    )

    if (isFailure(response)) {
      return response
    }

    return success(toDetailOffreImmersionQueryModel(response.data))
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (Authentification.estConseiller(utilisateur.type)) {
      await this.evenementService.creer(
        Evenement.Code.OFFRE_IMMERSION_AFFICHEE,
        utilisateur
      )
    }
  }
}

function buildParamsRechercheImmersion(idOffreImmersion: string): string {
  const [siret, appellationCode] = idOffreImmersion.split('-')
  return siret + '/' + appellationCode
}
