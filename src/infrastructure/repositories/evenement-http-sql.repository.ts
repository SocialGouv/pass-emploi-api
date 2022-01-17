import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Authentification } from 'src/domain/authentification'
import { Evenement } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { EvenementEngagementSqlModel } from '../sequelize/models/evenement-engagement.sql-model'

@Injectable()
export class EvenementHttpSqlRepository implements Evenement.Repository {
  private logger: Logger
  private apiUrl: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private dateService: DateService
  ) {
    this.logger = new Logger('EvenementHttpSqlRepository')
    this.apiUrl = this.configService.get('matomo').url
  }

  async sendEvenement(
    utilisateur: Authentification.Utilisateur,
    categorieEvenement: string,
    actionEvenement: string,
    nomEvenement?: string
  ): Promise<Result> {
    const params = new URLSearchParams()
    const structureUtilisateur =
      utilisateur.structure === Core.Structure.MILO
        ? 'MISSION_LOCALE'
        : utilisateur.structure

    params.append('rec', '1')
    params.append('idsite', this.configService.get('matomo').envId)

    const paramTypeUtilisateur = 'dimension1'
    const paramStructureUtilisateur = 'dimension2'
    const evenementCategorieQueryParam = 'e_c'
    const evenementActionQueryParam = 'e_a'
    const evenementNomQueryParam = 'e_n'

    params.append(paramTypeUtilisateur, utilisateur.type)
    params.append(paramStructureUtilisateur, structureUtilisateur)

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
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}`, params)
      )
      this.logger.log({
        status: response.status,
        method: response.config?.method,
        url: response.config?.url,
        params: response.config?.data
      })
    } catch (err) {
      this.logger.error(err)
    }

    const dateEvenement = this.dateService.nowJs()
    await EvenementEngagementSqlModel.create({
      categorie: categorieEvenement ?? null,
      action: actionEvenement ?? null,
      nom: nomEvenement ?? null,
      idUtilisateur: utilisateur.id,
      typeUtilisateur: utilisateur.type,
      dateEvenement: dateEvenement
    })
    return emptySuccess()
  }
}
