import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Evenement } from 'src/domain/evenement'

@Injectable()
export class EvenementHttpRepository implements Evenement.Repository {
  private logger: Logger
  private apiUrl: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('EvenementHttpRepository')
    this.apiUrl = this.configService.get('matomo').url
  }

  async sendEvenement(evenement: Evenement.Evenement): Promise<void> {
    const params = new URLSearchParams()
    params.append('idsite', this.configService.get('matomo').envId)

    const evenementCategorieQueryParam = 'e_c'
    const evenementActionQueryParam = 'e_a'
    const evenementNomQueryParam = 'e_n'

    if (evenement.categorie) {
      params.append(evenementCategorieQueryParam, evenement.categorie)
    }
    if (evenement.action) {
      params.append(evenementActionQueryParam, evenement.action)
    }
    if (evenement.nom) {
      params.append(evenementNomQueryParam, evenement.nom)
    }

    try {
      await firstValueFrom(
        this.httpService.get(`${this.apiUrl}`, {
          params
        })
      )
    } catch (e) {
      this.logger.error(e)
    }
  }
}
