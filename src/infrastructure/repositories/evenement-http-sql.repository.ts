import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Authentification } from 'src/domain/authentification'
import { Evenement } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'

@Injectable()
export class EvenementHttpSqlRepository implements Evenement.Repository {
  private logger: Logger
  private apiUrl: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private dateService: DateService
  ) {
    this.logger = new Logger('EvenementHttpRepository')
    this.apiUrl = this.configService.get('matomo').url
  }

  async sendEvenement(
    idUtilisateur: string,
    typeUtilisateur: Authentification.Type,
    categorieEvenement: string,
    actionEvenement: string,
    nomEvenement?: string
  ): Promise<void> {
    const params = new URLSearchParams()
    params.append('idsite', this.configService.get('matomo').envId)

    const evenementCategorieQueryParam = 'e_c'
    const evenementActionQueryParam = 'e_a'
    const evenementNomQueryParam = 'e_n'

    if (categorieEvenement) {
      params.append(evenementCategorieQueryParam, categorieEvenement)
    }
    if (actionEvenement) {
      params.append(evenementActionQueryParam, actionEvenement)
    }
    if (nomEvenement) {
      params.append(evenementNomQueryParam, nomEvenement)
    }

    try {
      await firstValueFrom(
        this.httpService.get(`${this.apiUrl}`, {
          params
        })
      )
      const dateEvenement = this.dateService.nowJs()
      if (typeUtilisateur === Authentification.Type.CONSEILLER) {
        await ConseillerSqlModel.update(
          { date_evenement_engagement: dateEvenement },
          { where: { id: idUtilisateur } }
        )
      } else if (typeUtilisateur === Authentification.Type.JEUNE) {
        await JeuneSqlModel.update(
          { date_evenement_engagement: dateEvenement },
          { where: { id: idUtilisateur } }
        )
      }
    } catch (e) {
      this.logger.error(e)
    }
  }
}
