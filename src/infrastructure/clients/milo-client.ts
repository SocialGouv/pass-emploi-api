import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import {
  Result,
  failure,
  isFailure,
  success
} from '../../building-blocks/types/result'
import {
  SessionConseillerMiloListeDto,
  StructureConseillerMiloDto
} from './dto/milo.dto'
import { handleAxiosError } from './utils/axios-error-handler'
import { DateTime } from 'luxon'

@Injectable()
export class MiloClient {
  private readonly apiUrl: string
  private readonly apiKeySessionsListeConseiller: string
  private readonly apiKeyUtilisateurs: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MiloClient')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeySessionsListeConseiller =
      this.configService.get('milo').apiKeySessionsListeConseiller
    this.apiKeyUtilisateurs = this.configService.get('milo').apiKeyUtilisateurs
  }

  async getSessionsConseiller(
    idpToken: string,
    idStructure: string,
    dateDebut?: DateTime,
    dateFin?: DateTime
  ): Promise<Result<SessionConseillerMiloListeDto>> {
    const params = new URLSearchParams()
    if (dateDebut)
      params.append(
        'dateDebutRecherche',
        dateDebut.toFormat('yyyy-MM-dd').toString()
      )
    if (dateFin)
      params.append(
        'dateFinRecherche',
        dateFin.toFormat('yyyy-MM-dd').toString()
      )

    // L'api ne renvoie que 50 sessions max par appel au delà, une pagination doit être mise en place. (voir doc 06/23)
    return this.get<SessionConseillerMiloListeDto>(
      `structures/${idStructure}/sessions`,
      this.apiKeySessionsListeConseiller,
      idpToken,
      params
    )
  }

  async getStructureConseiller(
    idpToken: string
  ): Promise<Result<StructureConseillerMiloDto>> {
    const resultStructures = await this.get<StructureConseillerMiloDto[]>(
      `utilisateurs/moi/structures`,
      this.apiKeyUtilisateurs,
      idpToken
    )

    if (isFailure(resultStructures)) {
      return resultStructures
    }
    const structurePrincipale = resultStructures.data.find(
      structureMilo => structureMilo.principale
    )
    if (!structurePrincipale) {
      return failure(
        new ErreurHttp('Structure Milo principale introuvable', 404)
      )
    }
    return success(structurePrincipale)
  }

  private async get<T>(
    suffixUrl: string,
    apiKey: string,
    idpToken: string,
    params?: URLSearchParams
  ): Promise<Result<T>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${this.apiUrl}/operateurs/${suffixUrl}`, {
          params,
          headers: {
            Authorization: `Bearer ${idpToken}`,
            'X-Gravitee-Api-Key': apiKey,
            operateur: 'APPLICATION_CEJ'
          }
        })
      )
      if (!response.data) {
        return failure(new ErreurHttp('Ressource Milo introuvable', 404))
      }
      return success(response.data)
    } catch (e) {
      return handleAxiosError(e, this.logger, 'Erreur GET Milo')
    }
  }
}
