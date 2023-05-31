import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Result,
  emptySuccess,
  isFailure,
  success
} from '../../building-blocks/types/result'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { DateService } from '../../utils/date-service'
import { PaginationQueryModel } from './query-models/common/pagination.query-model'

const NOMBRE_EVENEMENTS_MAX = 10
const PAGE_PAR_DEFAUT = 1

class EvenementEmploiQueryModel {
  @ApiProperty({ required: true })
  id: number
  @ApiProperty({ required: false })
  ville?: string
  @ApiProperty({ required: false })
  codePostal?: string
  @ApiProperty({ required: false })
  titre?: string
  @ApiProperty({ required: false })
  typeEvenement?: string
  @ApiProperty({ required: false })
  dateEvenement?: string
  @ApiProperty({ required: false })
  heureDebut?: string
  @ApiProperty({ required: false })
  heureFin?: string
}
export class EvenementsEmploiQueryModel {
  @ApiProperty({
    type: PaginationQueryModel
  })
  pagination: PaginationQueryModel

  @ApiProperty({
    type: EvenementEmploiQueryModel,
    isArray: true
  })
  results: EvenementEmploiQueryModel[]
}

export enum Modalite {
  ADIST = 'ADIST',
  ENPHY = 'ENPHY'
}

export interface GetEvenementsEmploiQuery extends Query {
  page?: number
  limit?: number
  codePostal: number
  secteurActivite?: string
  dateDebut?: string
  dateFin?: string
  typeEvenement?: number
  modalite?: Modalite
}

@Injectable()
export class GetEvenementsEmploiQueryHandler extends QueryHandler<
  GetEvenementsEmploiQuery,
  Result<EvenementsEmploiQueryModel>
> {
  constructor(private poleEmploiClient: PoleEmploiClient) {
    super('GetEvenementsEmploiQueryHandler')
  }

  async handle(
    query: GetEvenementsEmploiQuery
  ): Promise<Result<EvenementsEmploiQueryModel>> {
    const page = query.page ?? PAGE_PAR_DEFAUT
    const limit = query.limit ?? NOMBRE_EVENEMENTS_MAX

    const resultEvenements = await this.poleEmploiClient.getEvenementsEmploi({
      ...query,
      page,
      limit,
      dateDebut: DateService.fromStringToDateTime(query.dateDebut)
        ?.toUTC()
        .toFormat('yyyy-MM-dd'),
      dateFin: DateService.fromStringToDateTime(query.dateFin)
        ?.toUTC()
        .toFormat('yyyy-MM-dd')
    })

    if (isFailure(resultEvenements)) {
      return resultEvenements
    }

    return success({
      pagination: { page, limit, total: resultEvenements.data.totalElements },
      results: resultEvenements.data.content.map(evenement => ({
        id: evenement.id,
        ville: evenement.ville,
        codePostal: evenement.codePostal,
        titre: evenement.titre,
        typeEvenement: evenement.type,
        dateEvenement: evenement.dateEvenement,
        heureDebut: evenement.heureDebut,
        heureFin: evenement.heureFin,
        modalites: evenement.modalites
      }))
    })
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
