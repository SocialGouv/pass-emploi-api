import { Inject, Injectable } from '@nestjs/common'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { CVPoleEmploiQueryModel } from './query-models/jeunes.pole-emploi.query-model'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { ResultApi } from '../../building-blocks/types/result-api'
import { DocumentPoleEmploiDto } from '../../infrastructure/clients/dto/pole-emploi.dto'

export interface GetCVPoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetCVPoleEmploiQueryHandler extends QueryHandler<
  GetCVPoleEmploiQuery,
  Result<CVPoleEmploiQueryModel[]>
> {
  constructor(
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private keycloakClient: KeycloakClient
  ) {
    super('GetCVPoleEmploiQueryHandler')
  }
  async authorize(): Promise<Result> {
    throw new Error('not implemented')
  }

  async handle(
    query: GetCVPoleEmploiQuery
  ): Promise<Result<CVPoleEmploiQueryModel[]>> {
    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    const documentsPoleEmploiDto: ResultApi<DocumentPoleEmploiDto[]> =
      await this.poleEmploiPartenaireClient.getDocuments(idpToken)

    if (isFailure(documentsPoleEmploiDto)) {
      return documentsPoleEmploiDto
    }

    const cvPoleEmploiQueryModel: CVPoleEmploiQueryModel[] =
      documentsPoleEmploiDto.data
        .filter(estUnCVPoleEmploi)
        .map(fromCVDtoToCVQueryModel)
    return success(cvPoleEmploiQueryModel)
  }

  async monitor(): Promise<void> {
    return
  }
}

function estUnCVPoleEmploi(documentDto: DocumentPoleEmploiDto): boolean {
  return documentDto.type.code === 'CV'
}

function fromCVDtoToCVQueryModel(
  cvDto: DocumentPoleEmploiDto
): CVPoleEmploiQueryModel {
  return {
    titre: cvDto.titre,
    url: cvDto.url
  }
}
