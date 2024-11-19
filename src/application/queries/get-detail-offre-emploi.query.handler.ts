import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  isSuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { OffreEmploiDto } from '../../infrastructure/repositories/dto/pole-emploi.dto'
import { OffreEmploiQueryModel } from './query-models/offres-emploi.query-model'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { mapOrigine } from '../../infrastructure/repositories/mappers/offres-emploi.mappers'

export interface GetDetailOffreEmploiQuery extends Query {
  idOffreEmploi: string
}

@Injectable()
export class GetDetailOffreEmploiQueryHandler extends QueryHandler<
  GetDetailOffreEmploiQuery,
  Result<OffreEmploiQueryModel>
> {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private evenementService: EvenementService
  ) {
    super('GetDetailOffreEmploiQueryHandler')
  }

  async handle(
    query: GetDetailOffreEmploiQuery
  ): Promise<Result<OffreEmploiQueryModel>> {
    const result = await this.poleEmploiClient.getOffreEmploi(
      query.idOffreEmploi
    )

    if (isSuccess(result)) {
      if (result.data) {
        return success(toOffreEmploiQueryModel(result.data))
      }
      return failure(new NonTrouveError("Offre d'emploi", query.idOffreEmploi))
    }
    return result
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    query: GetDetailOffreEmploiQuery
  ): Promise<void> {
    if (utilisateur.type == Authentification.Type.CONSEILLER) {
      const offreEmploiDtoResult = await this.poleEmploiClient.getOffreEmploi(
        query.idOffreEmploi
      )
      if (isSuccess(offreEmploiDtoResult) && offreEmploiDtoResult.data) {
        await this.evenementService.creer(
          offreEmploiDtoResult.data.alternance
            ? Evenement.Code.OFFRE_ALTERNANCE_AFFICHEE
            : Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
          utilisateur
        )
      }
    }
  }
}

function toOffreEmploiQueryModel(
  offreEmploiDto: OffreEmploiDto
): OffreEmploiQueryModel {
  return {
    id: offreEmploiDto.id,
    urlRedirectPourPostulation:
      offreEmploiDto.contact?.urlPostulation ||
      offreEmploiDto.origineOffre?.partenaires?.at(0)?.url ||
      offreEmploiDto.origineOffre?.urlOrigine,
    data: offreEmploiDto,
    origine: mapOrigine(offreEmploiDto)
  }
}
