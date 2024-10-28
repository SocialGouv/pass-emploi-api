import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as CryptoJS from 'crypto-js'
import { firstValueFrom } from 'rxjs'
import { TypeUrlDiagoriente } from '../../application/queries/get-diagoriente-urls.query.handler'
import { CompteDiagorienteInvalideError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { handleAxiosError } from './utils/axios-error-handler'

const mapTypeUrlToRedirect: Record<TypeUrlDiagoriente, string> = {
  CHATBOT: '/centres_interet/chat',
  FAVORIS: '/metiers/metiers-favoris',
  RECOMMANDES: '/metiers/metiers-recommandes'
}
type UserInfo = {
  id: string
  email: string
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
          userInfo: anonymiserUserInfo(userInfo),
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

  async register(userInfo: UserInfo): Promise<Result> {
    try {
      const response = await this.post<{ date: unknown; errors?: unknown[] }>({
        query:
          'mutation ($clientId: String!, $clientSecret: String!, $userInfo: PartnerAuthUserInfo!) {\r\n  registerByPartner(clientId: $clientId, clientSecret: $clientSecret, userInfo: $userInfo) {\r\n    status\r\n  }\r\n}',
        variables: {
          clientId: this.diagorienteClientId,
          clientSecret: this.diagorienteClientSecret,
          userInfo: anonymiserUserInfo(userInfo)
        }
      })

      if (response.data.errors) {
        return failure(new CompteDiagorienteInvalideError(userInfo.id))
      }
      return emptySuccess()
    } catch (e) {
      e.config.data = 'REDACTED'
      return handleAxiosError(
        e,
        this.logger,
        'La création du compte Diagoriente a échoué'
      )
    }
  }

  async getMetiersFavoris(
    idJeune: string
  ): Promise<Result<MetiersFavorisDiagorienteDto>> {
    try {
      const response = await this.post<MetiersFavorisDiagorienteDto>({
        query:
          'query(\r\n  $userByPartnerClientId: String!\r\n  $userByPartnerClientSecret: String!\r\n  $userByPartnerUserId: String!\r\n) {\r\n  userByPartner(\r\n    clientId: $userByPartnerClientId\r\n    clientSecret: $userByPartnerClientSecret\r\n    userId: $userByPartnerUserId\r\n  ) {\r\n    favorites {\r\n      id\r\n      favorited\r\n      tag {\r\n        code\r\n        title\r\n      }\r\n    }\r\n  }\r\n}\r\n',
        variables: {
          userByPartnerClientId: this.diagorienteClientId,
          userByPartnerClientSecret: this.diagorienteClientSecret,
          userByPartnerUserId: idJeune
        }
      })

      return success(response.data)
    } catch (e) {
      e.config.data = 'REDACTED'
      return handleAxiosError(
        e,
        this.logger,
        'La récupération des métiers favoris Diagoriente a échoué'
      )
    }
  }

  private async post<T>(body: unknown): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.post<T>(this.apiUrl + '/graphql', body)
    )
  }
}

interface MetiersFavorisDiagorienteDto {
  data: {
    userByPartner: null | {
      favorites: Array<{
        tag: {
          code: string
          id: string
          title: string
        }
        id: string
        favorited: boolean
      }>
    }
  }
}

function anonymiserUserInfo(userInfo: UserInfo): {
  userId: string
  email: string
  firstName: string
  lastName: string
} {
  return {
    userId: userInfo.id,
    email: CryptoJS.MD5(userInfo.id) + '@pass-emploi.beta.gouv.fr',
    firstName: 'Utilisateur',
    lastName: 'Pass Emploi'
  }
}
