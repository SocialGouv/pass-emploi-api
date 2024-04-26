import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosRequestConfig } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'node:https'
import { firstValueFrom } from 'rxjs'
import {
  AnalyseAntivirusEchouee,
  AnalyseAntivirusPasTerminee,
  FichierMalveillant
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Fichier } from 'src/domain/fichier'
import { handleAxiosError } from 'src/infrastructure/clients/utils/axios-error-handler'

@Injectable()
export class AntivirusClient {
  private logger: Logger
  private apiUrl: string
  private requestConfig: AxiosRequestConfig

  constructor(private httpService: HttpService, configService: ConfigService) {
    this.logger = new Logger('AntivirusClient')

    const config = configService.get('jecliqueoupas')
    this.requestConfig = {
      headers: { 'X-Auth-token': config.token },
      httpsAgent: new https.Agent({
        ca: Buffer.from(config.cert, 'base64'),
        lookup: (_hostname, _opts, callback): void =>
          callback(null, [{ address: config.ip, family: 4 }])
      })
    }
    this.apiUrl = config.url
  }

  async declencherAnalyseAsynchrone(fichier: Fichier): Promise<Result<string>> {
    const body = new FormData()
    body.append('file', new Blob([fichier.buffer]), fichier.nom)

    try {
      const response = await firstValueFrom(
        this.httpService.post<AnalyseSoumiseDto>(
          this.apiUrl + '/submit',
          body,
          this.requestConfig
        )
      )
      const data = response.data
      if (data.status) return success(data.uuid)

      const analyseAntivirusEchouee = new AnalyseAntivirusEchouee(data.error)
      this.logger.error(analyseAntivirusEchouee)
      return failure(analyseAntivirusEchouee)
    } catch (e) {
      e.config.data = 'REDACTED'
      return handleAxiosError(
        e,
        this.logger,
        "L'analyse du fichier par l'antivirus a échoué : " +
          e.response.data.error
      )
    }
  }

  async recupererResultatAnalyse(idAnalyse: string): Promise<Result> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ done: boolean; is_malware: boolean }>(
          this.apiUrl + '/results/' + idAnalyse,
          this.requestConfig
        )
      )
      const data = response.data
      if (!data.done) return failure(new AnalyseAntivirusPasTerminee())
      if (!data.is_malware) return emptySuccess()
      return failure(new FichierMalveillant())
    } catch (e) {
      e.config.data = 'REDACTED'
      return handleAxiosError(
        e,
        this.logger,
        'La récupération de l’analyse du fichier a échoué : ' +
          e.response.data.error
      )
    }
  }
}

type AnalyseSoumiseDto =
  | { status: true; uuid: string }
  | { status: false; error: string }
