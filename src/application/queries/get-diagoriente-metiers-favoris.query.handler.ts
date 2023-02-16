import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { IsArray } from 'class-validator'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { DiagorienteClient } from '../../infrastructure/clients/diagoriente-client'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

class MetiersFavorisQueryModel {
  @ApiProperty()
  titre: string
  @ApiProperty()
  rome: string
}
export class DiagorienteMetiersFavorisQueryModel {
  @ApiProperty()
  aDesMetiersFavoris: boolean
  @ApiProperty({
    type: MetiersFavorisQueryModel,
    isArray: true,
    required: false
  })
  @IsArray()
  metiersFavoris?: MetiersFavorisQueryModel[]
}

export interface GetDiagorienteMetiersFavorisQuery extends Query {
  idJeune: string
  detail?: boolean
}

@Injectable()
export class GetDiagorienteMetiersFavorisQueryHandler extends QueryHandler<
  GetDiagorienteMetiersFavorisQuery,
  Result<DiagorienteMetiersFavorisQueryModel>
> {
  constructor(
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly diagorienteClient: DiagorienteClient
  ) {
    super('GetDiagorienteMetiersFavorisQueryHandler')
  }

  async handle(
    query: GetDiagorienteMetiersFavorisQuery
  ): Promise<Result<DiagorienteMetiersFavorisQueryModel>> {
    const result = await this.diagorienteClient.getMetiersFavoris(query.idJeune)

    if (isFailure(result)) {
      return result
    }

    const metiersFavoris = result.data.data.userByPartner.favorites
      .filter(favori => favori.favorited)
      .map(favori => ({ rome: favori.tag.code, titre: favori.tag.title }))

    return success({
      aDesMetiersFavoris: Boolean(metiersFavoris.length),
      metiersFavoris: query.detail === false ? undefined : metiersFavoris
    })
  }

  async authorize(
    query: GetDiagorienteMetiersFavorisQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
