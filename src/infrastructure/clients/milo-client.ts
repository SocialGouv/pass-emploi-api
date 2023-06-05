import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Result, failure, success } from '../../building-blocks/types/result'
import { handleAxiosError } from './utils/axios-error-handler'
import { KeycloakClient } from './keycloak-client'
import { Core } from '../../domain/core'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { SessionConseillerListeDto } from './dto/milo.dto'

@Injectable()
export class MiloClient {
  private readonly apiUrl: string
  private readonly apiKeySessionsListeConseiller: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private keycloakClient: KeycloakClient
  ) {
    this.logger = new Logger('MiloClient')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeySessionsListeConseiller =
      this.configService.get('milo').apiKeySessionsListeConseiller
  }

  async getSessionsConseiller(
    token: string,
    idStructure: string
  ): Promise<Result<SessionConseillerListeDto>> {
    const idpToken = await this.keycloakClient.exchangeTokenConseiller(
      token,
      Core.Structure.MILO
    )

    return this.get<SessionConseillerListeDto>(
      `structures/${idStructure}/sessions`,
      this.apiKeySessionsListeConseiller,
      idpToken
    )
  }

  private async get<T>(
    suffixUrl: string,
    apiKey: string,
    idpToken: string
  ): Promise<Result<T>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${this.apiUrl}/operateurs/${suffixUrl}`, {
          headers: {
            Authorization: `Bearer ${idpToken}`,
            'X-Gravitee-Api-Key': apiKey,
            operateur: 'APPLICATION_CEJ'
          }
        })
      )
      if (!response.data) {
        return failure(new ErreurHttp('Ressource Milo introuvable', 404))
      }
      return success(response.data)
    } catch (e) {
      return handleAxiosError(e, this.logger, 'Erreur GET Milo')
    }
  }
}
