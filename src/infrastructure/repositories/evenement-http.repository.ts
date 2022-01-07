import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
//import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
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
    params.append('rec', '1')
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
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}`, {
          params
        })
      )
      this.logger.log('###########################')
      this.logger.log(JSON.stringify(response))
      // TODO : @Ahmed tu peux voir comment faire fonctionner la requete à Matomo ?
    } catch (e) {
      this.logger.error(e)
      //throw new RuntimeException(e.statusText)
    }
  }
}
