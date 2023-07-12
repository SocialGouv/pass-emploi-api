import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import {
  SessionConseillerDetailDto,
  SessionConseillerMiloListeDto,
  SessionJeuneDetailDto,
  SessionJeuneMiloListeDto,
  StructureConseillerMiloDto
} from './dto/milo.dto'
import { handleAxiosError } from './utils/axios-error-handler'
import { DateTime } from 'luxon'

@Injectable()
export class MiloClient {
  private readonly apiUrl: string
  private readonly apiKeySessionsListeConseiller: string
  private readonly apiKeySessionsDetailEtListeJeune: string
  private readonly apiKeySessionDetailConseiller: string
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
    this.apiKeySessionsDetailEtListeJeune =
      this.configService.get('milo').apiKeySessionsDetailEtListeJeune
    this.apiKeySessionDetailConseiller =
      this.configService.get('milo').apiKeySessionDetailConseiller
    this.apiKeyUtilisateurs = this.configService.get('milo').apiKeyUtilisateurs
  }

  async getSessionsConseiller(
    idpToken: string,
    idStructure: string,
    timezone: string,
    dateDebut?: DateTime,
    dateFin?: DateTime
  ): Promise<Result<SessionConseillerMiloListeDto>> {
    const params = new URLSearchParams()
    if (dateDebut) {
      const debutRecherche = dateDebut.setZone(timezone)
      params.append('dateDebutRecherche', debutRecherche.toISODate())
    }
    if (dateFin) {
      const finRecherche = dateFin.setZone(timezone)
      params.append('dateFinRecherche', finRecherche.toISODate())
    }

    // L'api ne renvoie que 50 sessions max par appel au delà, une pagination doit être mise en place. (voir doc 06/23)
    return this.get<SessionConseillerMiloListeDto>(
      `structures/${idStructure}/sessions`,
      this.apiKeySessionsListeConseiller,
      idpToken,
      params
    )
  }

  async getSessionsJeune(
    idpToken: string,
    idDossier: string
  ): Promise<Result<SessionJeuneMiloListeDto>> {
    const params = new URLSearchParams()
    params.append('idDossier', idDossier)

    // L'api ne renvoie que 50 sessions max par appel au delà, une pagination doit être mise en place. (voir doc 06/23)
    return this.get<SessionJeuneMiloListeDto>(
      `sessions`,
      this.apiKeySessionsDetailEtListeJeune,
      idpToken,
      params
    )
  }

  async getDetailSessionConseiller(
    idpToken: string,
    idSession: string
  ): Promise<Result<SessionConseillerDetailDto>> {
    return this.get<SessionConseillerDetailDto>(
      `sessions/${idSession}`,
      this.apiKeySessionDetailConseiller,
      idpToken
    )
  }

  async getDetailSessionJeune(
    idpToken: string,
    idSession: string
  ): Promise<Result<SessionJeuneDetailDto>> {
    return this.get<SessionJeuneDetailDto>(
      `sessions/${idSession}`,
      this.apiKeySessionsDetailEtListeJeune,
      idpToken
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
