import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'

@Injectable()
export class ServiceCiviqueClient {
  private readonly apiUrl: string
  private readonly apiKey: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.apiUrl = this.configService.get('serviceCivique').url
    this.apiKey = this.configService.get('serviceCivique').apiKey
  }

  async get<T>(
    suffixUrl: string,
    params?: URLSearchParams
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.get<T>(`${this.apiUrl}/${suffixUrl}`, {
        headers: {
          apikey: this.apiKey
        },
        params
      })
    )
  }
}
