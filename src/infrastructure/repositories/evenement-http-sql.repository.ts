import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Authentification } from 'src/domain/authentification'
import { Evenement } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'

@Injectable()
export class EvenementHttpSqlRepository implements Evenement.Repository {
  private apiUrl: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private dateService: DateService
  ) {
    this.apiUrl = this.configService.get('matomo').url
  }

  async sendEvenement(
    utilisateur: Authentification.Utilisateur,
    categorieEvenement: string,
    actionEvenement: string,
    nomEvenement?: string
  ): Promise<void> {
    const params = new URLSearchParams()
    params.append('rec', '1')
    params.append('idsite', this.configService.get('matomo').envId)
    params.append(
      this.configService.get('matomo').paramTypeUtilisateur,
      utilisateur.type
    )
    params.append(
      this.configService.get('matomo').paramStructureUtilisateur,
      utilisateur.structure
    )

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

    await firstValueFrom(this.httpService.post(`${this.apiUrl}`, params))

    const dateEvenement = this.dateService.nowJs()
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await ConseillerSqlModel.update(
        { dateEvenementEngagement: dateEvenement },
        { where: { id: utilisateur.id } }
      )
    } else if (utilisateur.type === Authentification.Type.JEUNE) {
      await JeuneSqlModel.update(
        { dateEvenementEngagement: dateEvenement },
        { where: { id: utilisateur.id } }
      )
    }
  }
}
