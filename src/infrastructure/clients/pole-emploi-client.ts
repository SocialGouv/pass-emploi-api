import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  isSuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Notification } from '../../domain/notification/notification'
import { desTypeDemarchesDtosMock } from '../../fixtures/types-demarches.fixture'
import { DateService } from '../../utils/date-service'
import { buildError } from '../../utils/logger.module'
import { RateLimiterService } from '../../utils/rate-limiter.service'
import {
  EvenementsEmploiDto,
  NotificationDto,
  NotificationsPartenairesDto,
  OffreEmploiDto,
  OffresEmploiDto,
  OffresEmploiDtoWithTotal,
  TypeRDVPE
} from '../repositories/dto/pole-emploi.dto'
import { ListeTypeDemarchesDto, TypeDemarcheDto } from './dto/pole-emploi.dto'
import { handleAxiosError } from './utils/axios-error-handler'

const CODE_UTILISATEUR = 0

@Injectable()
export class PoleEmploiClient {
  inMemoryToken: {
    token: string | undefined
    tokenDate: DateTime | undefined
  }
  tokenExpiryInSeconds: number
  private readonly apiUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private dateService: DateService,
    private rateLimiterService: RateLimiterService
  ) {
    this.logger = new Logger('PoleEmploiClient')
    this.inMemoryToken = { token: undefined, tokenDate: undefined }
    this.apiUrl = this.configService.get('poleEmploi').url
  }

  async getEvenementsEmploi(criteres: {
    page: number
    limit: number
    codePostal: number
    secteurActivite?: string
    dateDebut?: string
    dateFin?: string
    typeEvenement?: number
  }): Promise<Result<EvenementsEmploiDto>> {
    const params = new URLSearchParams()
    if (criteres.page) {
      params.append('page', (criteres.page - 1).toString())
    }
    if (criteres.limit) {
      params.append('size', criteres.limit.toString())
    }
    const body: {
      codePostal?: string[]
      secteurActivite?: string
      dateDebut?: string
      dateFin?: string
      typeEvenement?: string
    } = {
      codePostal: criteres.codePostal
        ? [criteres.codePostal.toString()]
        : undefined,
      secteurActivite: criteres.secteurActivite,
      dateDebut: criteres.dateDebut,
      dateFin: criteres.dateFin,
      typeEvenement: criteres.typeEvenement?.toString()
    }

    try {
      const response = await this.post<EvenementsEmploiDto | undefined>(
        'evenements/v1/mee/evenements',
        body,
        params
      )
      return success(response.data ?? { totalElements: 0, content: [] })
    } catch (e) {
      return handleAxiosError(
        e,
        this.logger,
        'La récupération des évènements emploi a échoué'
      )
    }
  }

  async getOffreEmploi(
    idOffreEmploi: string
  ): Promise<Result<OffreEmploiDto | undefined>> {
    const result = await this.get<OffreEmploiDto | undefined>(
      `offresdemploi/v2/offres/${idOffreEmploi}`
    )
    if (isSuccess(result)) {
      return success(result.data.data)
    }
    if (result.error instanceof ErreurHttp && result.error.statusCode === 400) {
      return success(undefined)
    }
    return result
  }

  async getOffresEmploi(
    params?: URLSearchParams
  ): Promise<Result<OffresEmploiDtoWithTotal>> {
    const result = await this.get<OffresEmploiDto | undefined>(
      'offresdemploi/v2/offres/search',
      params
    )

    if (isFailure(result)) {
      return result
    }

    const response = result.data

    if (!response?.data) {
      return success({
        total: 0,
        resultats: []
      })
    }

    const { resultats } = response.data

    let total: number
    try {
      const contentRange = result.data.headers['content-range']
      const totalGroup = contentRange.split('/')[1] // content-range: offres 0-149/716799
      total = parseInt(totalGroup, 10)
    } catch (error) {
      this.logger.error(
        buildError(
          "La récupération du nombre total d'offres d'emploi a échoué",
          error
        )
      )

      total = resultats.length
    }

    return success({ total, resultats })
  }

  async getNotificationsRendezVous(
    idsJeunesPE: string[],
    dateHierISO: string,
    dateDuJourISO: string
  ): Promise<Notification.PoleEmploi[]> {
    await this.rateLimiterService.getNotificationsPE.attendreLaProchaineDisponibilite()
    const response = await this.post<NotificationsPartenairesDto>(
      'listernotificationspartenaires/v1/notifications/partenaires',
      {
        listeIdExterneDE: idsJeunesPE,
        dateDebutCreation: dateHierISO,
        dateFinCreation: dateDuJourISO
      }
    )
    return response.data.listeNotificationsPartenaires.map(notificationsDto => {
      return {
        idExterneDE: notificationsDto.idExterneDE,
        notifications: notificationsDto.notifications.map(
          this.toNotificationPoleEmploi.bind(this)
        )
      }
    })
  }

  async rechercherTypesDemarches(
    recherche: string
  ): Promise<TypeDemarcheDto[]> {
    const token = await this.getToken()

    try {
      const url = `${this.apiUrl}/rechercher-demarche/v1/solr/search/demarche`
      const body = {
        codeUtilisateur: CODE_UTILISATEUR,
        motCle: recherche
      }
      const result = await firstValueFrom(
        this.httpService.post<ListeTypeDemarchesDto>(url, body, {
          headers: { Authorization: `Bearer ${token}` }
        })
      )
      return result.data.listeDemarches ?? []
    } catch (e) {
      this.logger.error(
        buildError('Erreur lors de la récupération des types de démarches', e)
      )
      if (
        this.configService.get('environment') === 'development' ||
        this.configService.get('environment') === 'staging'
      ) {
        return desTypeDemarchesDtosMock()
      }
      throw e
    }
  }

  async get<T>(
    suffixUrl: string,
    params?: unknown,
    secondesAAttendre?: number
  ): Promise<Result<AxiosResponse<T>>> {
    if (secondesAAttendre) {
      await new Promise(resolve =>
        setTimeout(resolve, secondesAAttendre * 1000)
      )
    }

    const token = await this.getToken()
    return firstValueFrom(
      this.httpService.get<T>(`${this.apiUrl}/${suffixUrl}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
    )
      .then(res => success(res))
      .catch(e => {
        this.logger.error(e)

        const estLePremierRetry = secondesAAttendre === undefined
        if (
          e.response?.status === 429 &&
          estLePremierRetry &&
          e.response?.headers &&
          e.response?.headers['retry-after']
        ) {
          this.logger.log('Retry de la requête')
          return this.get<T>(
            suffixUrl,
            params,
            parseInt(e.response?.headers['retry-after'])
          )
        }

        if (e.response?.status >= 400 && e.response?.status < 500) {
          const erreur = new ErreurHttp(
            e.response.data?.message ?? 'Erreur API POLE EMPLOI',
            e.response.status
          )
          return failure(erreur)
        }
        throw e
      })
  }

  private async post<T>(
    suffixUrl: string,
    body?: unknown,
    params?: URLSearchParams
  ): Promise<AxiosResponse<T>> {
    const token = await this.getToken()
    return firstValueFrom(
      this.httpService.post<T>(`${this.apiUrl}/${suffixUrl}`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params
      })
    )
  }

  async getToken(): Promise<string> {
    const isTokenExpired =
      this.inMemoryToken.tokenDate &&
      this.dateService.now().diff(this.inMemoryToken.tokenDate).as('second') >
        this.tokenExpiryInSeconds

    if (!this.inMemoryToken.token || isTokenExpired) {
      this.inMemoryToken.token = await this.generateToken()
      this.inMemoryToken.tokenDate = this.dateService.now()
    }
    return this.inMemoryToken.token
  }

  private async generateToken(): Promise<string> {
    this.logger.log('Attempting to get an access token for Pole Emploi API')

    const poleEmploiConfiguration = this.configService.get('poleEmploi')

    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('client_id', poleEmploiConfiguration.clientId)
    params.append('client_secret', poleEmploiConfiguration.clientSecret)
    params.append('scope', poleEmploiConfiguration.scope)

    const loginUrl = `${poleEmploiConfiguration.loginUrl}?realm=%2Fpartenaire`

    const reponse = await firstValueFrom(
      this.httpService.post(loginUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    )

    const token = reponse.data.access_token
    const SECONDS_BEFORE_EXPIRY = 30
    this.tokenExpiryInSeconds = reponse.data.expires_in - SECONDS_BEFORE_EXPIRY

    this.logger.log(
      'An access token for Pole Emploi API has been retrieved successfully'
    )

    return token
  }

  private toNotificationPoleEmploi(
    notificationDto: NotificationDto
  ): Notification.PoleEmploi.Notification {
    try {
      const dateCreation = DateTime.fromFormat(
        notificationDto.dateCreation
          .replace('CEST', '+02:00')
          .replace('CET', '+01:00'),
        'EEE MMM d HH:mm:ss Z yyyy'
      )

      if (!dateCreation.isValid) {
        throw new Error(
          `La date de création de la notification ${notificationDto.idNotification} n'est pas valide`
        )
      }
      return {
        ...notificationDto,
        dateCreation,
        typeMouvementRDV: mapTypeRDVPE[notificationDto.typeMouvementRDV]
      }
    } catch (e) {
      this.logger.error(
        'Impossible de mapper la notification PE',
        notificationDto,
        e
      )
      return {
        ...notificationDto,
        dateCreation: this.dateService.now().minus({ day: 1 }),
        typeMouvementRDV: mapTypeRDVPE[notificationDto.typeMouvementRDV]
      }
    }
  }
}

const mapTypeRDVPE: Record<TypeRDVPE, Notification.TypeRdv> = {
  CREA: Notification.Type.NEW_RENDEZVOUS,
  MODIF: Notification.Type.UPDATED_RENDEZVOUS,
  SUPP: Notification.Type.DELETED_RENDEZVOUS
}
