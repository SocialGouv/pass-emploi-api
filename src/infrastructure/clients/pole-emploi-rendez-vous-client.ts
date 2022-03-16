import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { firstValueFrom } from 'rxjs'
import * as https from 'https'

export interface RendezVousPoleEmploiDto {
  theme?: string
  date: Date
  heure: string
  duree: number
  modaliteContact?: 'VISIO' | 'TELEPHONIQUE' | 'AGENCE'
  nomConseiller?: string
  prenomConseiller?: string
  agence?: string
  adresse?: {
    bureauDistributeur?: string
    ligne4?: string
    ligne5?: string
    ligne6?: string
  }
  commentaire?: string
  typeRDV?: 'RDVL' | 'CONVOCATION'
  lienVisio?: string
}

@Injectable()
export class PoleEmploiRendezVousClient {
  private readonly apiUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('PoleEmploiRendezVousClient')
    this.apiUrl = this.configService.get('poleEmploiRendezVous').url
  }

  async getRendezVous(tokenDuJeune: string): Promise<AxiosResponse> {
    this.logger.log(
      `recuperation des rendez-vous du jeune'
      )}`
    )
    return this.get('listerendezvous', tokenDuJeune)
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
            ? new https.Agent({ rejectUnauthorized: false })
            : undefined
      })
    )
  }
}
