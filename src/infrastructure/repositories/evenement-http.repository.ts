import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
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

    if (evenement.categorie) {
      params.append('e_c', evenement.categorie)
    }
    if (evenement.action) {
      params.append('e_a', evenement.action)
    }
    if (evenement.nom) {
      params.append('e_n', evenement.nom)
    }

    try {
      await firstValueFrom(
        this.httpService.get(`${this.apiUrl}`, {
          params
        })
      )
    } catch (e) {
      this.logger.error(e)
      throw new RuntimeException(e.statusText)
    }
  }
}
