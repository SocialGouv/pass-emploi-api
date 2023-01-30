import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { firstValueFrom } from 'rxjs'
import { TypeUrlDiagoriente } from '../../application/queries/get-diagoriente-url.query.handler.db'
import { Result, success } from '../../building-blocks/types/result'
import { handleAxiosError } from './utils/axios-error-handler'

const mapTypeUrlToRedirect: Record<TypeUrlDiagoriente, string> = {
  CHATBOT: '/centres_interet/chat',
  FAVORIS: '/metiers/metiers-favoris'
}
type UserInfo = {
  id: string
  email: string
  prenom: string
  nom: string
}

@Injectable()
export class DiagorienteClient {
  private readonly apiUrl: string
  private readonly diagorienteClientId: string
  private readonly diagorienteClientSecret: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    const configDiagoriente = this.configService.get('diagoriente')
    this.apiUrl = configDiagoriente.url
    this.diagorienteClientId = configDiagoriente.clientId
    this.diagorienteClientSecret = configDiagoriente.clientSecret
    this.logger = new Logger('DiagorienteClient')
  }

  async getUrl(
    typeUrl: TypeUrlDiagoriente,
    userInfo: UserInfo
  ): Promise<Result<string>> {
    try {
      const response = await this.post<{ data: { partnerAuthURL: string } }>({
        query:
          'mutation PartnerAuthURL(\n  $clientId: String!\n  $clientSecret: String!\n  $userInfo: PartnerAuthUserInfo!\n  $redirectUri: String\n) {\n  partnerAuthURL(\n    clientId: $clientId\n    clientSecret: $clientSecret\n    userInfo: $userInfo\n    redirectUri: $redirectUri\n  )\n}',
        variables: {
          clientId: this.diagorienteClientId,
          clientSecret: this.diagorienteClientSecret,
          userInfo: {
            userId: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.prenom,
            lastName: userInfo.nom
          },
          redirectUri: mapTypeUrlToRedirect[typeUrl]
        }
      })

      return success(response.data.data.partnerAuthURL)
    } catch (e) {
      e.config.data = 'REDACTED'
      return handleAxiosError(
        e,
        this.logger,
        "La récupération de l'url Diagoriente a échoué"
      )
    }
  }

  private async post<T>(body: unknown): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.post<T>(this.apiUrl + '/graphql', body)
    )
  }
}
