import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { IsArray } from 'class-validator'
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
import { JeunesRepositoryToken, Jeune } from '../../domain/jeune/jeune'
import { DiagorienteClient } from '../../infrastructure/clients/diagoriente-client'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

class MetiersFavorisQueryModel {
  @ApiProperty()
  libelle: string
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
    private readonly diagorienteClient: DiagorienteClient,
    @Inject(JeunesRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository
  ) {
    super('GetDiagorienteMetiersFavorisQueryHandler')
  }

  async handle(
    query: GetDiagorienteMetiersFavorisQuery
  ): Promise<Result<DiagorienteMetiersFavorisQueryModel>> {
    const jeune = (await this.jeunesRepository.get(query.idJeune))!

    if (!jeune.email) {
      return failure(new MauvaiseCommandeError('Jeune sans email'))
    }

    const infosJeune = {
      id: jeune.id,
      email: jeune.email,
      prenom: jeune.firstName,
      nom: jeune.lastName
    }
    const resultRegister = await this.diagorienteClient.register(infosJeune)

    if (isFailure(resultRegister)) {
      return resultRegister
    }

    const result = await this.diagorienteClient.getMetiersFavoris(query.idJeune)

    if (isFailure(result)) {
      return result
    }

    const metiersFavoris = result.data.data.userByPartner.favorites
      .filter(favori => favori.favorited)
      .map(favori => ({ rome: favori.tag.code, libelle: favori.tag.title }))

    return success({
      aDesMetiersFavoris: Boolean(metiersFavoris.length),
      metiersFavoris: query.detail === false ? undefined : metiersFavoris
    })
  }

  async authorize(
    query: GetDiagorienteMetiersFavorisQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorizeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
