import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { MILO_DATE_FORMAT } from 'src/application/queries/query-mappers/milo.mappers'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import { DateService } from '../../utils/date-service'
import { RateLimiterService } from '../../utils/rate-limiter.service'
import { getAPMInstance } from '../monitoring/apm.init'
import {
  InscrireJeuneSessionDto,
  InscritSessionMiloDto,
  ListeSessionsConseillerMiloDto,
  ListeSessionsJeuneMiloDto,
  SessionConseillerDetailDto,
  SessionJeuneDetailDto,
  SessionParDossierJeuneDto,
  StructureConseillerMiloDto
} from './dto/milo.dto'
import { handleAxiosError } from './utils/axios-error-handler'

export const TAILLE_PAGE_MAX_APIS_MILO: number = 150

@Injectable()
export class MiloClient {
  private readonly apiUrl: string
  private readonly apiKeySessionsListeConseiller: string
  private readonly apiKeySessionsDetailEtListeJeune: string
  private readonly apiKeySessionDetailConseiller: string
  private readonly apiKeyInstanceSessionEcritureConseiller: string
  private readonly apiKeyEnvoiEmail: string
  private readonly apiKeyUtilisateurs: string
  private readonly logger: Logger
  private readonly apmService: APM.Agent

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService,
    private dateService: DateService
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
    this.apiKeyEnvoiEmail = this.configService.get('milo').apiKeyEnvoiEmail
  }

  async getSessionsConseillerParStructure(
    idpToken: string,
    idStructure: string,
    timezone: string,
    options: {
      periode: { debut?: DateTime; fin?: DateTime }
    }
  ): Promise<Result<SessionConseillerDetailDto[]>> {
    const params = new URLSearchParams()
    params.append('taillePage', TAILLE_PAGE_MAX_APIS_MILO.toString())
    params.append('rechercheInscrits', 'true')
    if (options.periode.debut) {
      const debutRecherche = options.periode.debut.setZone(timezone)
      params.append('dateDebutRecherche', debutRecherche.toISODate())
    }
    if (options.periode.fin) {
      const finRecherche = options.periode.fin.setZone(timezone)
      params.append('dateFinRecherche', finRecherche.toISODate())
    }

    await this.rateLimiterService.sessionsStructureMiloRateLimiter.attendreLaProchaineDisponibilite()

    // On assure jusqu'à 300 résultats
    const sessions: SessionConseillerDetailDto[] = []
    const dtoResult = await this.get<ListeSessionsConseillerMiloDto>(
      `structures/${idStructure}/sessions`,
      {
        apiKey: this.apiKeySessionsListeConseiller,
        idpToken
      },
      params
    )
    if (isFailure(dtoResult)) {
      return dtoResult
    }
    sessions.push(...dtoResult.data.sessions)
    if (dtoResult.data.sessions.length >= TAILLE_PAGE_MAX_APIS_MILO) {
      params.append('page', '2')
      const dtoPage2Result = await this.get<ListeSessionsConseillerMiloDto>(
        `structures/${idStructure}/sessions`,
        {
          apiKey: this.apiKeySessionsListeConseiller,
          idpToken
        },
        params
      )
      if (isSuccess(dtoPage2Result)) {
        sessions.push(...dtoPage2Result.data.sessions)
      }
    }
    return success(sessions)
  }

  async getSessionsParDossierJeune(
    idpToken: string,
    idDossier: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<SessionParDossierJeuneDto[]>> {
    await this.rateLimiterService.sessionsJeuneMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.recupererSessionsParDossierJeune(
      idpToken,
      idDossier,
      this.apiKeySessionsDetailEtListeJeune,
      periode
    )
  }

  async getSessionsParDossierJeunePourConseiller(
    idpToken: string,
    idDossier: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<SessionParDossierJeuneDto[]>> {
    await this.rateLimiterService.sessionsConseillerMiloRateLimiter.attendreLaProchaineDisponibilite()
    return this.recupererSessionsParDossierJeune(
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
    idSession: string,
    idDossier: string,
    timezone: string
  ): Promise<Result<SessionParDossierJeuneDto>> {
    await this.rateLimiterService.sessionsJeuneMiloRateLimiter.attendreLaProchaineDisponibilite()
    const resultDetail = await this.get<SessionJeuneDetailDto>(
      `sessions/${idSession}`,
      {
        apiKey: this.apiKeySessionsDetailEtListeJeune,
        idpToken
      }
    )
    if (isFailure(resultDetail)) {
      return resultDetail
    }
    const detailSessionDto = resultDetail.data
    const dateSession = DateTime.fromFormat(
      detailSessionDto.session.dateHeureDebut,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )

    const resultSessionsParDossier = await this.getSessionsParDossierJeune(
      idpToken,
      idDossier,
      { debut: dateSession, fin: dateSession }
    )
    if (isFailure(resultSessionsParDossier)) {
      return resultSessionsParDossier
    }
    const dtoAvecInscription = resultSessionsParDossier.data.find(
      session => session.session.id.toString() === idSession
    )

    return success({
      ...detailSessionDto,
      sessionInstance: dtoAvecInscription?.sessionInstance
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
      await new Promise(resolve => setTimeout(resolve, 50))
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
      await new Promise(resolve => setTimeout(resolve, 50))
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
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return emptySuccess()
  }

  async envoyerEmailActivation(
    idpToken: string,
    email: string
  ): Promise<Result> {
    const result = await this.put(
      `sue/sendVerifyEmail`,
      email,
      this.apiKeyEnvoiEmail,
      idpToken,
      false
    )
    if (isFailure(result)) return result
    return emptySuccess()
  }

  private async recupererSessionsParDossierJeune(
    idpToken: string,
    idDossier: string,
    apiKey: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<SessionParDossierJeuneDto[]>> {
    const params = new URLSearchParams()
    params.append('idDossier', idDossier)
    params.append('taillePage', TAILLE_PAGE_MAX_APIS_MILO.toString())
    if (periode?.debut) {
      params.append('dateDebutRecherche', periode.debut.toISODate())
    }

    let fin = periode?.fin
    if (!fin) {
      const debut = periode?.debut ?? this.dateService.now()
      fin = debut.plus({ months: 3 })
    }
    params.append('dateFinRecherche', fin.toISODate())

    // On assure jusqu'à 300 résultats
    const sessions: SessionParDossierJeuneDto[] = []
    const dtoResult = await this.get<ListeSessionsJeuneMiloDto>(
      `sessions`,
      {
        apiKey,
        idpToken
      },
      params
    )
    if (isFailure(dtoResult)) {
      return dtoResult
    }
    sessions.push(...dtoResult.data.sessions)
    if (dtoResult.data.sessions.length >= TAILLE_PAGE_MAX_APIS_MILO) {
      params.append('page', '2')
      const dtoPage2Result = await this.get<ListeSessionsJeuneMiloDto>(
        `sessions`,
        {
          apiKey,
          idpToken
        },
        params
      )
      if (isSuccess(dtoPage2Result)) {
        sessions.push(...dtoPage2Result.data.sessions)
      }
    }
    return success(sessions)
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
    idpToken: string,
    isAPIOperateur = true
  ): Promise<Result> {
    const prefixUrl = isAPIOperateur ? 'operateurs/' : ''
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.apiUrl}/${prefixUrl}${suffixUrl}`,
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
      return handleAxiosError(e, this.logger, 'Erreur PUT Milo')
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
