import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { OffreEmploiQueryModel } from './query-models/offres-emploi.query-model'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { OffreEmploiDto } from '../../infrastructure/repositories/dto/pole-emploi.dto'

export interface GetDetailOffreEmploiQuery extends Query {
  idOffreEmploi: string
}

@Injectable()
export class GetDetailOffreEmploiQueryHandler extends QueryHandler<
  GetDetailOffreEmploiQuery,
  OffreEmploiQueryModel | undefined
> {
  constructor(private poleEmploiClient: PoleEmploiClient) {
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

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailOffreEmploiQuery
  ): Promise<void> {
    return
  }

  async monitor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    return
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
