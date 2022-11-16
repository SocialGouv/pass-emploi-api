import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { OffreEmploiDto } from '../../infrastructure/repositories/dto/pole-emploi.dto'
import { OffreEmploiQueryModel } from './query-models/offres-emploi.query-model'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'

export interface GetDetailOffreEmploiQuery extends Query {
  idOffreEmploi: string
}

@Injectable()
export class GetDetailOffreEmploiQueryHandler extends QueryHandler<
  GetDetailOffreEmploiQuery,
  OffreEmploiQueryModel | undefined
> {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private evenementService: EvenementService
  ) {
    super('GetDetailOffreEmploiQueryHandler')
  }

  async handle(
    query: GetDetailOffreEmploiQuery
  ): Promise<OffreEmploiQueryModel | undefined> {
    const offreEmploiDto = await this.poleEmploiClient.getOffreEmploi(
      query.idOffreEmploi
    )
    if (offreEmploiDto) {
      return toOffreEmploiQueryModel(offreEmploiDto)
    } else {
      return undefined
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    query: GetDetailOffreEmploiQuery
  ): Promise<void> {
    if (utilisateur.type == Authentification.Type.CONSEILLER) {
      const offreEmploiDto = await this.poleEmploiClient.getOffreEmploi(
        query.idOffreEmploi
      )
      if (offreEmploiDto) {
        await this.evenementService.creer(
          offreEmploiDto.alternance
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
    data: offreEmploiDto
  }
}
