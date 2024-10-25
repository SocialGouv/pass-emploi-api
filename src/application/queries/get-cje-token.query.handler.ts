import { HttpService } from '@nestjs/axios'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiProperty } from '@nestjs/swagger'
import { firstValueFrom } from 'rxjs'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import * as CryptoJS from 'crypto-js'

export class CJETokenQueryModel {
  @ApiProperty()
  widgetToken: string
}

export interface GetCJETokenQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetCJETokenQueryHandler extends QueryHandler<
  GetCJETokenQuery,
  Result<CJETokenQueryModel>
> {
  private apiUrl: string
  private apiKey: string

  constructor(
    @Inject(JeuneRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    super('GetCJETokenQueryHandler')
    this.apiUrl = this.configService.get('cje.apiUrl')!
    this.apiKey = this.configService.get('cje.apiKey')!
  }

  async handle(query: GetCJETokenQuery): Promise<Result<CJETokenQueryModel>> {
    const jeune = await this.jeunesRepository.get(query.idJeune)

    const hashUserId = CryptoJS.MD5(jeune!.id)

    const responseCJE = await firstValueFrom(
      this.httpService.post<{
        data: { widgetToken: string }
      }>(
        this.apiUrl + '/widgetTokenGenerator',
        { user_id: hashUserId.toString() },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      )
    )

    return success({ widgetToken: responseCJE.data.data.widgetToken })
  }

  async authorize(
    query: GetCJETokenQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
