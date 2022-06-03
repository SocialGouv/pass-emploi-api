import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { DateService } from '../../utils/date-service'
import {
  OffreEmploiDto,
  OffresEmploiDto
} from '../repositories/offre-emploi-http-sql.repository.db'
import { ListeTypeDemarchesDto, TypeDemarcheDto } from './dto/pole-emploi.dto'
import { buildError } from '../../utils/logger.module'

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
    private dateService: DateService
  ) {
    this.logger = new Logger('PoleEmploiClient')
    this.inMemoryToken = { token: undefined, tokenDate: undefined }
    this.apiUrl = this.configService.get('poleEmploi').url
  }

  async getOffreEmploi(
    idOffreEmploi: string
  ): Promise<OffreEmploiDto | undefined> {
    const response = await this.get(`offresdemploi/v2/offres/${idOffreEmploi}`)
    if (response.status !== 200) {
      return undefined
    }
    return response.data
  }

  async getOffresEmploi(params?: unknown): Promise<OffresEmploiDto> {
    const response = await this.get('offresdemploi/v2/offres/search', params)
    return response.data
  }

  async rechercherTypesDemarches(
    recherche: string
  ): Promise<TypeDemarcheDto[]> {
    const token = await this.getToken()

    try {
      const url = `${this.apiUrl}/rechercher-demarche/v1/solr/search/demarche`
      const body = {
        codeUtilisateur: 0,
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
        return desTypeDemarchesDtos()
      }
      throw e
    }
  }

  async get(suffixUrl: string, params?: unknown): Promise<AxiosResponse> {
    const token = await this.getToken()
    return firstValueFrom(
      this.httpService.get(`${this.apiUrl}/${suffixUrl}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
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
}

const desTypeDemarchesDtos = (): TypeDemarcheDto[] => [
  {
    codeCommentDemarche: 'FAKE-C12.06',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q12',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-Par un autre moyen',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Recherche d'offres d'emploi ou d'entreprises"
  },
  {
    codeCommentDemarche: 'FAKE-C12.07',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q12',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-Moyen à définir',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Recherche d'offres d'emploi ou d'entreprises"
  },
  {
    codeCommentDemarche: 'FAKE-C13.01',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q13',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-Sur internet',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  },
  {
    codeCommentDemarche: 'FAKE-C13.02',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q13',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-En présentiel',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  },
  {
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q14',
    estUneAction: false,
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Réponse à des offres d'emploi"
  }
]
