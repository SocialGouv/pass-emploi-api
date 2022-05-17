import { HttpService } from '@nestjs/axios'
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { firstValueFrom } from 'rxjs'
import { buildError } from '../../utils/logger.module'

@Injectable()
export class KeycloakClient {
  private logger: Logger
  private issuerUrl: string
  private clientId: string
  private clientSecret: string
  private issuerApiUrl: string

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {
    this.logger = new Logger('KeycloakClient')
    this.issuerApiUrl = this.configService.get('oidc').issuerApiUrl
    this.issuerUrl = this.configService.get('oidc').issuerUrl
    this.clientId = this.configService.get('oidc').clientId
    this.clientSecret = this.configService.get('oidc').clientSecret
  }

  public async exchangeTokenPoleEmploiJeune(bearer: string): Promise<string> {
    const url = `${this.issuerUrl}/protocol/openid-connect/token`
    const payload = {
      subject_token: bearer,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      requested_issuer: 'pe-jeune'
    }
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    try {
      const result: TokenExchangeResponse = (
        await firstValueFrom(
          this.httpService.post(url, new URLSearchParams(payload), { headers })
        )
      ).data
      this.logger.log({
        message: 'Token exchange success',
        expires_in: result.expires_in
      })
      return result.access_token
    } catch (e) {
      this.logger.error(buildError('erreur lors du token exchange', e))
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        code: 'token_pole_emploi_expired'
      })
    }
  }

  public async deleteUserByIdUser(idUser: string): Promise<void> {
    const token = await this.getToken()
    const url = `${this.issuerApiUrl}/users`

    const headers = {
      Authorization: `Bearer ${token}`
    }
    const params = {
      q: `id_user:${idUser}`
    }

    try {
      const reponseGet: AxiosResponse<UserResponse[]> = await firstValueFrom(
        this.httpService.get(url, {
          params,
          headers
        })
      )

      const userIdKeycloak = reponseGet.data[0]?.id

      if (userIdKeycloak) {
        await firstValueFrom(
          this.httpService.delete(`${url}/${userIdKeycloak}`, { headers })
        )
        this.logger.log(`utilisateur ${idUser} supprimé`)
      } else {
        this.logger.log(`utilisateur ${idUser} n'existe pas dans keycloak`)
      }
    } catch (e) {
      this.logger.error(
        buildError(
          `erreur lors de la suppression de l\'utilisateur ${idUser}`,
          e
        )
      )
      throw new RuntimeException(e)
    }
  }

  private async getToken(): Promise<string> {
    const url = `${this.issuerUrl}/protocol/openid-connect/token`
    const payload = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    }
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    try {
      const result: TokenResponse = (
        await firstValueFrom(
          this.httpService.post(url, new URLSearchParams(payload), { headers })
        )
      ).data

      return result.access_token
    } catch (e) {
      this.logger.error(buildError("erreur lors de l'obtention du token", e))
      throw new RuntimeException(e)
    }
  }
}

interface TokenExchangeResponse {
  access_token: string
  expires_in: string
}

interface TokenResponse {
  access_token: string
}

interface UserResponse {
  id: string
}
