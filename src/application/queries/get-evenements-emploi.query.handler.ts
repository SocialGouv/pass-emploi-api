import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, emptySuccess } from '../../building-blocks/types/result'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { EvenementsEmploiQueryModel } from './query-models/evenements-emploi.query-model'

export interface GetEvenementsEmploiQuery extends Query {
  page?: number
  limit?: number
  codePostal: string
  secteurActivite?: string
  dateDebut?: string
  dateFin?: string
  typeEvenement?: number
  modalite?: string
}

@Injectable()
export class GetEvenementsEmploiQueryHandler extends QueryHandler<
  GetEvenementsEmploiQuery,
  EvenementsEmploiQueryModel
> {
  constructor(private poleEmploiClient: PoleEmploiClient) {
    super('GetEvenementsEmploiQueryHandler')
  }

  async handle(
    query: GetEvenementsEmploiQuery
  ): Promise<EvenementsEmploiQueryModel> {
    const response = await this.poleEmploiClient.getEvenementsEmploi(
      {
        codePostal: [query.codePostal],
        secteurActivite: query.secteurActivite,
        dateDebut: query.dateDebut,
        dateFin: query.dateFin,
        typeEvenement: query.typeEvenement,
        modalite: query.modalite
      },
      {
        page: query.page,
        size: query.limit
      }
    )

    const evenements = response.content.map(evenement => {
      return {
        id: evenement.id,
        ville: evenement.ville,
        codePostal: evenement.codePostal,
        titre: evenement.titre,
        type: evenement.type,
        dateEvenement: evenement.dateEvenement,
        heureDebut: evenement.heureDebut,
        heureFin: evenement.heureFin,
        modalites: evenement.modalites
      }
    })

    return {
      pagination: {
        page: query.page ? query.page : 0,
        limit: query.limit ? query.limit : 20,
        total: response.totalElements
      },
      results: evenements
    }
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
