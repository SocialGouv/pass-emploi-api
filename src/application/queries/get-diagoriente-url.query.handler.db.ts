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
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { DiagorienteClient } from '../../infrastructure/clients/diagoriente-client'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export class DiagorienteUrlQueryModel {
  @ApiProperty()
  url: string
}

export enum TypeUrlDiagoriente {
  CHATBOT = 'CHATBOT',
  FAVORIS = 'FAVORIS'
}

export interface GetDiagorienteUrlQuery extends Query {
  idJeune: string
  typeUrl: TypeUrlDiagoriente
}

@Injectable()
export class GetDiagorienteUrlQueryHandler extends QueryHandler<
  GetDiagorienteUrlQuery,
  Result<DiagorienteUrlQueryModel>
> {
  constructor(
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    @Inject(JeunesRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository,
    private readonly diagorienteClient: DiagorienteClient
  ) {
    super('GetUrlOrientationProQueryHandler')
  }

  async handle(
    query: GetDiagorienteUrlQuery
  ): Promise<Result<DiagorienteUrlQueryModel>> {
    const jeune = (await this.jeunesRepository.get(query.idJeune))!

    if (!jeune.email) {
      return failure(new MauvaiseCommandeError('Jeune sans email'))
    }

    const result = await this.diagorienteClient.getUrl(query.typeUrl, {
      id: jeune.id,
      email: jeune.email,
      prenom: jeune.firstName,
      nom: jeune.lastName
    })

    if (isFailure(result)) {
      return result
    }
    return success({ url: result.data })
  }

  async authorize(
    query: GetDiagorienteUrlQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
