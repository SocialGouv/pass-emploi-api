import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as https from 'node:https'
import { firstValueFrom } from 'rxjs'
import { Result, success } from 'src/building-blocks/types/result'
import { Fichier } from 'src/domain/fichier'
import { handleAxiosError } from 'src/infrastructure/clients/utils/axios-error-handler'

@Injectable()
export class AntivirusClient {
  private readonly apiUrl: string
  private readonly hostIp: string
  private readonly token: string
  private readonly cert: Buffer
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('AntivirusClient')

    const config = this.configService.get('jecliqueoupas')
    this.apiUrl = config.url
    this.hostIp = config.ip
    this.token = config.token
    this.cert = Buffer.from(config.cert, 'base64')
  }

  async analyze(
    fichier: Fichier
  ): Promise<Result<{ status: boolean; uuid?: string; error?: string }>> {
    const body = new FormData()
    body.append('file', new Blob([fichier.buffer]), fichier.nom)

    try {
      const response = await firstValueFrom(
        this.httpService.post<{
          status: boolean
          uuid?: string
          error?: string
        }>(this.apiUrl + '/submit', body, {
          headers: { 'X-Auth-token': this.token },
          httpsAgent: new https.Agent({
            ca: this.cert,
            lookup: (_hostname, _opts, callback) =>
              callback(null, [{ address: this.hostIp, family: 4 }])
          })
        })
      )
      const data = response.data
      return success(data)
    } catch (e) {
      e.config.data = 'REDACTED'
      return handleAxiosError(
        e,
        this.logger,
        "L'analyze du fichier par l'antivirus a échoué"
      )
    }
  }
}
