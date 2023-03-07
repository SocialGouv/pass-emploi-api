import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { URLSearchParams } from 'url'
import { CreateContactImmersionCommand } from '../routes/immersion.controller'

@Injectable()
export class ImmersionClient {
  private readonly apiUrl: string
  private readonly immersionApiKey: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.apiUrl = this.configService.get('immersion').url
    this.immersionApiKey = this.configService.get('immersion').apiKey
  }

  async post<T>(
    suffixUrl: string,
    params: CreateContactImmersionCommand
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
