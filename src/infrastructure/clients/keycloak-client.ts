import { HttpService } from '@nestjs/axios'
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

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
      this.logger.log('Token exchange success', {
        expires_in: result.expires_in
      })
      return result.access_token
    } catch (e) {
      this.logger.error('erreur lors du token exchange', e)
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        code: 'token_pole_emploi_expired'
      })
    }
  }
}

interface TokenExchangeResponse {
  access_token: string
  expires_in: string
}
