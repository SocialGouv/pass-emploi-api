import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { firstValueFrom } from 'rxjs'
import {
  emptySuccess,
  failure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { URLSearchParams } from 'url'
import { handleAxiosError } from './utils/axios-error-handler'
import { PartenaireImmersion } from '../repositories/dto/immersion.dto'
import { ErreurHttp } from '../../building-blocks/types/domain-error'

export interface FormulaireImmersionPayload {
  appellationCode: string
  siret: string
  potentialBeneficiaryFirstName: string
  potentialBeneficiaryLastName: string
  potentialBeneficiaryEmail: string
  contactMode: string
  potentialBeneficiaryPhone: string
  immersionObjective: string
  locationId: string | null
  message?: string
}

@Injectable()
export class ImmersionClient {
  private readonly apiUrl: string
  private readonly immersionApiKey: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.apiUrl = this.configService.get('immersion').url
    this.immersionApiKey = this.configService.get('immersion').apiKey
    this.logger = new Logger('ImmersionClient')
  }

  async getOffres(
    params: URLSearchParams
  ): Promise<Result<PartenaireImmersion.DtoV2[]>> {
    try {
      const response = await this.get<PartenaireImmersion.DtoV2[]>(
        'v2/search',
        params
      )

      return success(response.data)
    } catch (erreur) {
      if (erreur.response?.status === 401)
        return failure(new ErreurHttp('API Key Immersion invalide', 400))

      return handleAxiosError(
        erreur,
        this.logger,
        'ERROR API getOffres immersion'
      )
    }
  }

  async getDetailOffre(
    params: string
  ): Promise<Result<PartenaireImmersion.DtoV2>> {
    try {
      const response = await this.get<PartenaireImmersion.DtoV2>(
        `v2/search/${params}`
      )
      return success(response.data)
    } catch (erreur) {
      return handleAxiosError(
        erreur,
        this.logger,
        'ERROR API getDetail immersion'
      )
    }
  }

  async envoyerFormulaireImmersion(
    params: FormulaireImmersionPayload
  ): Promise<Result> {
    try {
      await this.post('v2/contact-establishment', params)
      return emptySuccess()
    } catch (erreur) {
      return handleAxiosError(
        erreur,
        this.logger,
        `L'envoi du formulaire immersion a échoué`
      )
    }
  }

  private async post<T>(
    suffixUrl: string,
    params: unknown
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.post<T>(`${this.apiUrl}/${suffixUrl}`, params, {
        headers: {
          Authorization: this.immersionApiKey
        }
      })
    )
  }

  async get<T>(
    suffixUrl: string,
    params?: URLSearchParams
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.get<T>(`${this.apiUrl}/${suffixUrl}`, {
        params,
        headers: {
          Authorization: this.immersionApiKey
        }
      })
    )
  }
}
