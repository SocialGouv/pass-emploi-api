import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { DiagorienteClient } from '../../infrastructure/clients/diagoriente-client'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export class DiagorienteUrlsQueryModel {
  @ApiProperty()
  urlChatbot: string
  @ApiProperty()
  urlFavoris: string
  @ApiProperty()
  urlRecommandes: string
}

export enum TypeUrlDiagoriente {
  CHATBOT = 'CHATBOT',
  FAVORIS = 'FAVORIS',
  RECOMMANDES = 'RECOMMANDES'
}

export interface GetDiagorienteUrlsQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetDiagorienteUrlsQueryHandler extends QueryHandler<
  GetDiagorienteUrlsQuery,
  Result<DiagorienteUrlsQueryModel>
> {
  constructor(
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    @Inject(JeuneRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository,
    private readonly diagorienteClient: DiagorienteClient
  ) {
    super('GetDiagorienteUrlsQueryHandler')
  }

  async handle(
    query: GetDiagorienteUrlsQuery
  ): Promise<Result<DiagorienteUrlsQueryModel>> {
    const jeune = (await this.jeunesRepository.get(query.idJeune))!

    if (!jeune.email) {
      return failure(new MauvaiseCommandeError('Jeune sans email'))
    }

    const infosJeune = {
      id: jeune.id,
      email: jeune.email
    }

    const [resultChatbot, resultFavoris, resultRecommandes] = await Promise.all(
      [
        this.diagorienteClient.getUrl(TypeUrlDiagoriente.CHATBOT, infosJeune),
        this.diagorienteClient.getUrl(TypeUrlDiagoriente.FAVORIS, infosJeune),
        this.diagorienteClient.getUrl(
          TypeUrlDiagoriente.RECOMMANDES,
          infosJeune
        )
      ]
    )

    if (isFailure(resultChatbot)) {
      return resultChatbot
    }
    if (isFailure(resultFavoris)) {
      return resultFavoris
    }
    if (isFailure(resultRecommandes)) {
      return resultRecommandes
    }
    return success({
      urlChatbot: resultChatbot.data,
      urlFavoris: resultFavoris.data,
      urlRecommandes: resultRecommandes.data
    })
  }

  async authorize(
    query: GetDiagorienteUrlsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
