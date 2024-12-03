import { HttpService } from '@nestjs/axios'
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { firstValueFrom } from 'rxjs'
import { Core, estMilo, estPoleEmploiOuCDOuAvenirPro } from 'src/domain/core'
import { buildError } from 'src/utils/logger.module'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'

@Injectable()
export class KeycloakClient {
  private logger: Logger
  private issuerUrl: string
  private clientId: string
  private clientSecret: string

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {
    this.logger = new Logger('KeycloakClient')
    this.issuerUrl = this.configService.get('oidc').issuerUrl
    this.clientId = this.configService.get('oidc').clientId
    this.clientSecret = this.configService.get('oidc').clientSecret
  }

  public async exchangeTokenConseillerMilo(bearer: string): Promise<string> {
    return this.exchangeToken(bearer, Core.Structure.MILO)
  }

  public async exchangeTokenJeune(
    bearer: string,
    structure: Core.Structure
  ): Promise<string> {
    return this.exchangeToken(bearer, structure)
  }

  public async exchangeTokenConseillerJeune(
    bearer: string,
    subJeune: string
  ): Promise<string> {
    return this.exchangeToken(bearer, undefined, subJeune)
  }

  private async exchangeToken(
    bearer: string,
    structure?: Core.Structure,
    requestedTokenSub?: string
  ): Promise<string> {
    const url = `${this.issuerUrl}/protocol/openid-connect/token`
    const payload = {
      subject_token: bearer,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      client_id: this.clientId,
      client_secret: this.clientSecret
    }
    if (requestedTokenSub) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      payload.requested_token_sub = requestedTokenSub
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
      let message
      if (e.code === 'ECONNABORTED' || e.status >= '500') {
        message = 'token_exchange_error'
      } else {
        if (!structure) {
          message = 'token_expired'
        } else if (estPoleEmploiOuCDOuAvenirPro(structure)) {
          message = 'token_pole_emploi_expired'
        } else if (estMilo(structure)) {
          message = 'token_milo_expired'
        }
      }

      throw new UnauthorizedException({
        statusCode: 401,
        code: 'Unauthorized',
        message
      })
    }
  }

  public async deleteUserByIdUser(idUserCEJ: string): Promise<void> {
    const token = await this.getToken()
    const url = `${this.configService.get('oidc').issuerApiUrl}/users`

    const headers = {
      Authorization: `Bearer ${token}`
    }
    const params = {
      q: `id_user:${idUserCEJ}`
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
        this.logger.log(`utilisateur ${idUserCEJ} supprimé`)
      } else {
        this.logger.log(`utilisateur ${idUserCEJ} n'existe pas dans keycloak`)
      }
    } catch (e) {
      this.logger.error(
        buildError(
          `erreur lors de la suppression de l'utilisateur ${idUserCEJ}`,
          e
        )
      )
      if (e.response?.status !== 404) {
        throw new RuntimeException(e)
      }
    }
  }
  public async deleteAccount(idUser: string): Promise<void> {
    const apiKey = this.configService.get('oidc.apiKey')
    const url = `${this.configService.get('oidc').issuerApiUrl}/accounts`

    const headers = {
      'X-API-KEY': apiKey
    }

    const jeune = await JeuneSqlModel.findByPk(idUser)
    let idAuth = jeune?.idAuthentification

    if (!idAuth) {
      const conseiller = await ConseillerSqlModel.findByPk(idUser)
      idAuth = conseiller?.idAuthentification
    }

    if (!idAuth) {
      throw new NotFoundException('User to delete not found')
    }
    try {
      await firstValueFrom(
        this.httpService.delete(`${url}/${idAuth}`, { headers })
      )
      this.logger.log(`utilisateur ${idUser} supprimé`)
    } catch (e) {
      this.logger.error(
        buildError(
          `erreur lors de la suppression de l'utilisateur ${idUser}`,
          e
        )
      )
      throw e
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
