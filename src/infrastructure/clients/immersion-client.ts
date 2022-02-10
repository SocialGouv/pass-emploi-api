import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'

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

  async post(suffixUrl: string, payload?: unknown): Promise<AxiosResponse> {
    return firstValueFrom(
      this.httpService.post(`${this.apiUrl}/${suffixUrl}`, payload)
    )
  }

  async get(suffixUrl: string): Promise<AxiosResponse> {
    return firstValueFrom(
      this.httpService.get(`${this.apiUrl}/${suffixUrl}`, {
        headers: {
          Authorization: this.immersionApiKey
        }
      })
    )
  }
}
