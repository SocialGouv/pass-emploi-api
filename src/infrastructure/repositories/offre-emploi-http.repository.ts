import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import {
  OffresEmploi,
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from '../../domain/offres-emploi'
import { DateService } from '../../utils/date-service'
import {
  toOffresEmploiQueryModel,
  toOffreEmploiQueryModel
} from './mappers/offres-emploi.mappers'

@Injectable()
export class OffresEmploiHttpRepository implements OffresEmploi.Repository {
  private inMemoryToken: {
    token: string | undefined
    tokenDate: DateTime | undefined
  }
  private readonly poleEmploiApiUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private dateService: DateService
  ) {
    this.logger = new Logger('OffresEmploiHttpRepository')
    this.inMemoryToken = { token: undefined, tokenDate: undefined }
    this.poleEmploiApiUrl = this.configService.get('poleEmploi').url
  }

  async findAll(
    page: number,
    limit: number,
    alternance: boolean,
    query?: string,
    departement?: string
  ): Promise<OffresEmploiQueryModel> {
    const params = new URLSearchParams()
    params.append('sort', '1')
    params.append('range', this.generateRange(page, limit))

    if (query) {
      params.append('motsCles', query)
    }
    if (departement) {
      params.append('departement', departement)
    }
    if (alternance) {
      params.append('natureContrat', 'E2')
    }

    const token = await this.getToken()
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.poleEmploiApiUrl}/offresdemploi/v2/offres/search`,
        { params, headers: { Authorization: `Bearer ${token}` } }
      )
    )

    return toOffresEmploiQueryModel(page, limit, response.data)
  }

  async getOffreEmploiQueryModelById(
    idOffreEmploi: string
  ): Promise<OffreEmploiQueryModel | undefined> {
    const token = await this.getToken()
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.poleEmploiApiUrl}/offresdemploi/v2/offres/${idOffreEmploi}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    )

    if (response.status !== 200) {
      return undefined
    }

    return toOffreEmploiQueryModel(response.data)
  }

  async getToken(): Promise<string> {
    const TOKEN_EXPIRY_MINUTES = 24
    const isTokenExpired =
      this.inMemoryToken.tokenDate &&
      this.inMemoryToken.tokenDate?.diffNow().as('minute') >
        TOKEN_EXPIRY_MINUTES

    if (!this.inMemoryToken.token || isTokenExpired) {
      this.inMemoryToken.token = await this.generateToken()
      this.inMemoryToken.tokenDate = this.dateService.now()
    }
    return this.inMemoryToken.token
  }

  async generateToken(): Promise<string> {
    this.logger.log('Attempting to get an access token for Pole Emploi API')

    const poleEmploiConfiguration = this.configService.get('poleEmploi')
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('client_id', poleEmploiConfiguration.clientId)
    params.append('client_secret', poleEmploiConfiguration.clientSecret)
    params.append('scope', poleEmploiConfiguration.scope)
    const loginUrl = `${poleEmploiConfiguration.loginUrl}?realm=%2Fpartenaire`

    const tokenRequest = await firstValueFrom(
      this.httpService.post(loginUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    )

    const token = tokenRequest.data.access_token

    this.logger.log(
      'An access token for Pole Emploi API has been retrieved successfully'
    )

    return token
  }

  generateRange(page: number, limit: number): string {
    return `${(page - 1) * limit}-${page * limit - 1}`
  }
}

export interface OffreEmploiDto {
  id: string
  titre: string
  typeContrat: string
  dureeTravailLibelleConverti: string
  entreprise?: {
    nom: string
  }
  lieuTravail?: {
    libelle: string
    codePostal: string
    commune: string
  }
  contact: {
    urlPostulation: string
  }
  origineOffre: {
    urlOrigine: string
  }
  alternance?: boolean
}

export interface OffresEmploiDto {
  resultats: OffreEmploiDto[]
}
