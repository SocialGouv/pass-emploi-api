import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'https'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class PoleEmploiPrestationsClient {
  private readonly apiUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('PoleEmploiPrestationsClient')
    this.apiUrl = this.configService.get('poleEmploiPrestations').url
  }

  async getRendezVous(
    tokenDuJeune: string,
    date: DateTime
  ): Promise<AxiosResponse> {
    this.logger.log(
      `recuperation des prestations du jeune à date du ${date.toFormat(
        'yyyy-MM-dd'
      )}`
    )
    const params = new URLSearchParams()
    params.append('dateRecherche', date.toFormat('yyyy-MM-dd'))

    return this.get('rendez-vous', tokenDuJeune, params)
  }

  async getLienVisio(
    tokenDuJeune: string,
    idVisio: string
  ): Promise<AxiosResponse> {
    this.logger.log('recuperation visio')
    const params = new URLSearchParams()
    params.append('idVisio', idVisio)

    return this.get(`lien-visio/rendez-vous/${idVisio}`, tokenDuJeune)
  }

  private get(
    suffixUrl: string,
    tokenDuJeune: string,
    params?: URLSearchParams
  ): Promise<AxiosResponse> {
    return firstValueFrom(
      this.httpService.get(`${this.apiUrl}/${suffixUrl}`, {
        params,
        headers: { Authorization: `Bearer ${tokenDuJeune}` },
        httpsAgent:
          this.configService.get('environment') !== 'prod'
            ? new https.Agent({
                rejectUnauthorized: false
              })
            : undefined
      })
    )
  }
}
