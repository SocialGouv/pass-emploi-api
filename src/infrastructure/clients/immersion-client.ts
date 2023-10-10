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
import { RechercheOffreInvalide } from '../../building-blocks/types/domain-error'

type Offer = {
  romeCode: string
  romeLabel: string
}

export interface FormulaireImmersionPayload {
  offer: Offer
  siret: string
  potentialBeneficiaryFirstName: string
  potentialBeneficiaryLastName: string
  potentialBeneficiaryEmail: string
  contactMode: string
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
    } catch (e) {
      if (e.response?.status === 400) {
        const message = e.response.data.errors
          .map((error: { message: string }) => error.message)
          .join(' - ')
        return failure(new RechercheOffreInvalide(message))
      }
      throw e
    }
  }

  async postFormulaireImmersion(
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
