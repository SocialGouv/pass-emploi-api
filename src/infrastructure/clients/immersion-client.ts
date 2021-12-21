import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

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

  async post<T>(suffixUrl: string, payload?: unknown): Promise<T> {
    return (
      await firstValueFrom(
        this.httpService.post<T>(`${this.apiUrl}/${suffixUrl}`, payload)
      )
    ).data
  }

  async get<T>(suffixUrl: string): Promise<T> {
    return (
      await firstValueFrom(
        this.httpService.get<T>(`${this.apiUrl}/${suffixUrl}`, {
          headers: {
            Authorization: this.immersionApiKey
          }
        })
      )
    ).data
  }
}
