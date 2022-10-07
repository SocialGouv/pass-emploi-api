import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { Notification } from '../../domain/notification/notification'
import { desTypeDemarchesDtosMock } from '../../fixtures/types-demarches.fixture'
import { DateService } from '../../utils/date-service'
import { buildError } from '../../utils/logger.module'
import { RateLimiterService } from '../../utils/rate-limiter.service'
import {
  NotificationDto,
  NotificationsPartenairesDto,
  OffreEmploiDto,
  OffresEmploiDto,
  OffresEmploiDtoWithTotal,
  TypeRDVPE
} from '../repositories/dto/pole-emploi.dto'
import { ListeTypeDemarchesDto, TypeDemarcheDto } from './dto/pole-emploi.dto'

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

  async getOffreEmploi(
    idOffreEmploi: string
  ): Promise<OffreEmploiDto | undefined> {
    const response = await this.get<OffreEmploiDto>(
      `offresdemploi/v2/offres/${idOffreEmploi}`
    )
    if (response.status !== 200) {
      return undefined
    }
    return response.data
  }

  async getOffresEmploi(
    params?: URLSearchParams
  ): Promise<OffresEmploiDtoWithTotal> {
    const response = await this.get<OffresEmploiDto | undefined>(
      'offresdemploi/v2/offres/search',
      params
    )

    if (!response.data) {
      return {
        total: 0,
        resultats: []
      }
    }

    const { resultats } = response.data
    let total: number
    try {
      const contentRange = response.headers['content-range']
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

    return { total, resultats }
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

  async get<T>(suffixUrl: string, params?: unknown): Promise<AxiosResponse<T>> {
    const token = await this.getToken()
    return firstValueFrom(
      this.httpService.get<T>(`${this.apiUrl}/${suffixUrl}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
    )
  }

  private async post<T>(
    suffixUrl: string,
    body?: unknown
  ): Promise<AxiosResponse<T>> {
    const token = await this.getToken()
    return firstValueFrom(
      this.httpService.post<T>(`${this.apiUrl}/${suffixUrl}`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        notificationDto.dateCreation.replace('CEST', '+02:00'),
        'EEE MMM d HH:mm:ss Z yyyy'
      )
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
