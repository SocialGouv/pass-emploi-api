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
  InscrireJeuneSessionDto,
  InscritSessionMiloDto,
  ListeSessionsConseillerMiloDto,
  ListeSessionsJeuneMiloDto,
  SessionConseillerDetailDto,
  SessionJeuneDetailDto,
  StructureConseillerMiloDto
} from './dto/milo.dto'
import { handleAxiosError } from './utils/axios-error-handler'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../monitoring/apm.init'
import { RateLimiterService } from '../../utils/rate-limiter.service'

@Injectable()
export class MiloClient {
  private readonly apiUrl: string
  private readonly apiKeySessionsListeConseiller: string
  private readonly apiKeySessionsDetailEtListeJeune: string
  private readonly apiKeySessionDetailConseiller: string
  private readonly apiKeyInstanceSessionEcritureConseiller: string
  private readonly apiKeyUtilisateurs: string
  private readonly logger: Logger
  private readonly apmService: APM.Agent

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService
  ) {
    this.logger = new Logger('MiloClient')
    this.apmService = getAPMInstance()
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
    options: {
      periode?: { dateDebut?: DateTime; dateFin?: DateTime }
      page?: number
    }
  ): Promise<Result<ListeSessionsConseillerMiloDto>> {
    const TAILLE_PAGE_LARGE = '500'
    const params = new URLSearchParams()
    params.append('taillePage', TAILLE_PAGE_LARGE)
    if (options.periode && options.periode.dateDebut) {
      const debutRecherche = options.periode.dateDebut.setZone(timezone)
      params.append('dateDebutRecherche', debutRecherche.toISODate())
    }
    if (options.periode && options.periode.dateFin) {
      const finRecherche = options.periode.dateFin.setZone(timezone)
      params.append('dateFinRecherche', finRecherche.toISODate())
    }
    if (options.page) {
      params.append('page', options.page.toString())
    }

    await this.rateLimiterService.sessionsStructureMiloRateLimiter.attendreLaProchaineDisponibilite()
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
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<ListeSessionsJeuneMiloDto>> {
    await this.rateLimiterService.sessionsJeuneMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.recupererSessionsParDossier(
      idpToken,
      idDossier,
      this.apiKeySessionsDetailEtListeJeune,
      periode
    )
  }

  async getSessionsJeunePourConseiller(
    idpToken: string,
    idDossier: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<ListeSessionsJeuneMiloDto>> {
    await this.rateLimiterService.sessionsConseillerMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.recupererSessionsParDossier(
      idpToken,
      idDossier,
      this.apiKeySessionDetailConseiller,
      periode
    )
  }

  async getDetailSessionConseiller(
    idpToken: string,
    idSession: string
  ): Promise<Result<SessionConseillerDetailDto>> {
    await this.rateLimiterService.sessionsConseillerMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.get<SessionConseillerDetailDto>(`sessions/${idSession}`, {
      apiKey: this.apiKeySessionDetailConseiller,
      idpToken
    })
  }

  async getDetailSessionJeune(
    idpToken: string,
    idSession: string
  ): Promise<Result<SessionJeuneDetailDto>> {
    await this.rateLimiterService.sessionsJeuneMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.get<SessionJeuneDetailDto>(`sessions/${idSession}`, {
      apiKey: this.apiKeySessionsDetailEtListeJeune,
      idpToken
    })
  }

  async getListeInscritsSession(
    idpToken: string,
    idSession: string
  ): Promise<Result<InscritSessionMiloDto[]>> {
    await this.rateLimiterService.sessionsConseillerMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.get<InscritSessionMiloDto[]>(`sessions/${idSession}/inscrits`, {
      apiKey: this.apiKeySessionDetailConseiller,
      idpToken
    })
  }

  async getStructureConseiller(
    idpToken: string
  ): Promise<Result<StructureConseillerMiloDto>> {
    await this.rateLimiterService.structuresMiloRateLimiter.attendreLaProchaineDisponibilite()
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
  ): Promise<Result<InscrireJeuneSessionDto[]>> {
    const dto: InscrireJeuneSessionDto[] = []
    for (const idDossier of idsDossier) {
      const result = await this.post<InscrireJeuneSessionDto>(
        `dossiers/${idDossier}/instances-session`,
        idSession,
        this.apiKeyInstanceSessionEcritureConseiller,
        idpToken
      )
      if (isFailure(result)) {
        return result
      }
      if (result.data) {
        dto.push(result.data)
      }
    }

    return success(dto)
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
      dateDebutReelle?: string
    }>
  ): Promise<Result> {
    for (const modification of modifications) {
      const result = await this.put(
        `dossiers/${modification.idDossier}/instances-session/${modification.idInstanceSession}`,
        {
          statut: modification.statut,
          commentaire: modification.commentaire,
          dateDebutReelle: modification.dateDebutReelle
        },
        this.apiKeyInstanceSessionEcritureConseiller,
        idpToken
      )
      if (isFailure(result)) return result
    }

    return emptySuccess()
  }

  private recupererSessionsParDossier(
    idpToken: string,
    idDossier: string,
    apiKey: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<ListeSessionsJeuneMiloDto>> {
    const TAILLE_PAGE_LARGE = '500'
    const params = new URLSearchParams()
    params.append('idDossier', idDossier)
    params.append('taillePage', TAILLE_PAGE_LARGE)
    if (periode?.debut) {
      params.append('dateDebutRecherche', periode.debut.toFormat('yyyy-MM-dd'))
    }
    if (periode?.fin) {
      params.append('dateFinRecherche', periode.fin.toFormat('yyyy-MM-dd'))
    }

    // L'api ne renvoie que 50 sessions max par appel au delà, une pagination doit être mise en place. (voir doc 06/23)
    return this.get<ListeSessionsJeuneMiloDto>(
      `sessions`,
      {
        apiKey,
        idpToken
      },
      params
    )
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
      if (auth.idpToken) {
        headers.Authorization = `Bearer ${auth.idpToken}`
      }

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
      this.apmService.captureError(e)
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
      this.apmService.captureError(e)
      return handleAxiosError(e, this.logger, 'Erreur POST Milo')
    }
  }

  private async post<T>(
    suffixUrl: string,
    payload: { [p: string]: string } | string,
    apiKey: string,
    idpToken: string
  ): Promise<Result<T | void>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(
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
      return response.data ? success(response.data) : emptySuccess()
    } catch (e) {
      this.apmService.captureError(e)
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
      this.apmService.captureError(e)
      return handleAxiosError(e, this.logger, 'Erreur DELETE Milo')
    }
  }
}
