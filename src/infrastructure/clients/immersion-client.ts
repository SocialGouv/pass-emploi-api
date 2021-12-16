import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class ImmersionClient {
  private readonly apiUrl: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.apiUrl = this.configService.get('immersion').url
  }

  async post<T>(suffixUrl: string, payload?: unknown): Promise<AxiosResponse> {
    return await firstValueFrom(
      this.httpService.post<T>(`${this.apiUrl}/${suffixUrl}`, payload)
    )
  }
}
