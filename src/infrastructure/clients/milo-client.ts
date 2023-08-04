import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import {
  InscritSessionMiloDto,
  ListeSessionsConseillerMiloDto,
  ListeSessionsJeuneMiloDto,
  SessionConseillerDetailDto,
  SessionJeuneDetailDto,
  StructureConseillerMiloDto
} from './dto/milo.dto'
import { handleAxiosError } from './utils/axios-error-handler'

@Injectable()
export class MiloClient {
  private readonly apiUrl: string
  private readonly apiKeySessionsListeConseiller: string
  private readonly apiKeySessionsDetailEtListeJeune: string
  private readonly apiKeySessionDetailConseiller: string
  private readonly apiKeyInstanceSessionEcritureConseiller: string
  private readonly apiKeyUtilisateurs: string
  private readonly logger: Logger

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
    this.apiKeyInstanceSessionEcritureConseiller =
      this.configService.get('milo').apiKeyInstanceSessionEcritureConseiller
    this.apiKeyUtilisateurs = this.configService.get('milo').apiKeyUtilisateurs
  }

  async getSessionsConseiller(
    idpToken: string,
    idStructure: string,
    timezone: string,
    dateDebut?: DateTime,
    dateFin?: DateTime
  ): Promise<Result<ListeSessionsConseillerMiloDto>> {
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
    return this.get<ListeSessionsConseillerMiloDto>(
      `structures/${idStructure}/sessions`,
      {
        apiKey: this.apiKeySessionsListeConseiller,
        idpToken
      },
      params
    )
  }

  async getSessionsJeune(
    idpToken: string,
    idDossier: string,
    recherche?: { debut: DateTime; fin: DateTime }
  ): Promise<Result<ListeSessionsJeuneMiloDto>> {
    const params = new URLSearchParams()
    params.append('idDossier', idDossier)
    if (recherche) {
      params.append(
        'dateDebutRecherche',
        recherche.debut.toFormat('yyyy-MM-dd')
      )
      params.append('dateFinRecherche', recherche.fin.toFormat('yyyy-MM-dd'))
    }

    // L'api ne renvoie que 50 sessions max par appel au delà, une pagination doit être mise en place. (voir doc 06/23)
    return this.get<ListeSessionsJeuneMiloDto>(
      `sessions`,
      {
        apiKey: this.apiKeySessionsDetailEtListeJeune,
        idpToken
      },
      params
    )
  }

  async getDetailSessionConseiller(
    idpToken: string,
    idSession: string
  ): Promise<Result<SessionConseillerDetailDto>> {
    return this.get<SessionConseillerDetailDto>(`sessions/${idSession}`, {
      apiKey: this.apiKeySessionDetailConseiller,
      idpToken
    })
  }

  async getDetailSessionJeune(
    idpToken: string,
    idSession: string
  ): Promise<Result<SessionJeuneDetailDto>> {
    return this.get<SessionJeuneDetailDto>(`sessions/${idSession}`, {
      apiKey: this.apiKeySessionsDetailEtListeJeune,
      idpToken
    })
  }

  async getListeInscritsSession(
    idpToken: string,
    idSession: string
  ): Promise<Result<InscritSessionMiloDto[]>> {
    return this.get<InscritSessionMiloDto[]>(`sessions/${idSession}/inscrits`, {
      apiKey: this.apiKeySessionDetailConseiller,
      idpToken
    })
  }

  async getStructureConseiller(
    idpToken: string
  ): Promise<Result<StructureConseillerMiloDto>> {
    const resultStructures = await this.get<StructureConseillerMiloDto[]>(
      `utilisateurs/moi/structures`,
      {
        apiKey: this.apiKeyUtilisateurs,
        idpToken
      }
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

  async inscrireJeunesSession(
    idpToken: string,
    idSession: string,
    idsDossier: string[]
  ): Promise<Result> {
    for (const idDossier of idsDossier) {
      const result = await this.post(
        `dossiers/${idDossier}/instances-session`,
        idSession,
        this.apiKeyInstanceSessionEcritureConseiller,
        idpToken
      )
      if (isFailure(result)) {
        return result
      }
    }

    return emptySuccess()
  }

  async desinscrireJeunesSession(
    idpToken: string,
    desinscriptions: Array<{ idDossier: string; idInstanceSession: string }>
  ): Promise<Result> {
    for (const desinscription of desinscriptions) {
      const result = await this.delete(
        `dossiers/${desinscription.idDossier}/instances-session/${desinscription.idInstanceSession}`,
        this.apiKeyInstanceSessionEcritureConseiller,
        idpToken
      )
      if (isFailure(result)) return result
    }

    return emptySuccess()
  }

  async modifierInscriptionJeunesSession(
    idpToken: string,
    modifications: Array<{
      idDossier: string
      idInstanceSession: string
      statut: string
      commentaire?: string
      dateFinReelle?: string
    }>
  ): Promise<Result> {
    for (const modification of modifications) {
      const result = await this.put(
        `dossiers/${modification.idDossier}/instances-session/${modification.idInstanceSession}`,
        {
          statut: modification.statut,
          commentaire: modification.commentaire,
          dateFinReelle: modification.dateFinReelle
        },
        this.apiKeyInstanceSessionEcritureConseiller,
        idpToken
      )
      if (isFailure(result)) return result
    }

    return emptySuccess()
  }

  private async get<T>(
    suffixUrl: string,
    auth: {
      apiKey: string
      idpToken?: string
    },
    params?: URLSearchParams
  ): Promise<Result<T>> {
    try {
      const headers: Record<string, string> = {
        'X-Gravitee-Api-Key': auth.apiKey,
        operateur: 'APPLICATION_CEJ'
      }
      if (auth.idpToken) headers.Authorization = `Bearer ${auth.idpToken}`

      const response = await firstValueFrom(
        this.httpService.get<T>(`${this.apiUrl}/operateurs/${suffixUrl}`, {
          params,
          headers
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

  private async put(
    suffixUrl: string,
    payload: { [p: string]: string | undefined } | string,
    apiKey: string,
    idpToken: string
  ): Promise<Result> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.apiUrl}/operateurs/${suffixUrl}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${idpToken}`,
              'X-Gravitee-Api-Key': apiKey,
              operateur: 'APPLICATION_CEJ',
              'Content-Type': 'application/json'
            }
          }
        )
      )
      return emptySuccess()
    } catch (e) {
      return handleAxiosError(e, this.logger, 'Erreur POST Milo')
    }
  }

  private async post(
    suffixUrl: string,
    payload: { [p: string]: string } | string,
    apiKey: string,
    idpToken: string
  ): Promise<Result> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/operateurs/${suffixUrl}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${idpToken}`,
              'X-Gravitee-Api-Key': apiKey,
              operateur: 'APPLICATION_CEJ',
              'Content-Type': 'application/json'
            }
          }
        )
      )
      return emptySuccess()
    } catch (e) {
      return handleAxiosError(e, this.logger, 'Erreur POST Milo')
    }
  }

  private async delete(
    suffixUrl: string,
    apiKey: string,
    idpToken: string
  ): Promise<Result> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.apiUrl}/operateurs/${suffixUrl}`, {
          headers: {
            Authorization: `Bearer ${idpToken}`,
            'X-Gravitee-Api-Key': apiKey,
            operateur: 'APPLICATION_CEJ'
          }
        })
      )
      return emptySuccess()
    } catch (e) {
      return handleAxiosError(e, this.logger, 'Erreur DELETE Milo')
    }
  }
}
