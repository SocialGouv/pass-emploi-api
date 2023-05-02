import { Inject, Injectable } from '@nestjs/common'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { CVPoleEmploiQueryModel } from './query-models/jeunes.pole-emploi.query-model'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { DocumentPoleEmploiDto } from '../../infrastructure/clients/dto/pole-emploi.dto'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { NonTrouveError } from '../../building-blocks/types/domain-error'

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
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private keycloakClient: KeycloakClient,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetCVPoleEmploiQueryHandler')
  }
  async authorize(
    query: GetCVPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      Core.structuresPoleEmploiBRSA
    )
  }

  async handle(
    query: GetCVPoleEmploiQuery
  ): Promise<Result<CVPoleEmploiQueryModel[]>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const idpToken = await this.keycloakClient.exchangeTokenJeune(
      query.accessToken,
      jeune.structure
    )

    const documentsPoleEmploiDto: Result<DocumentPoleEmploiDto[]> =
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
