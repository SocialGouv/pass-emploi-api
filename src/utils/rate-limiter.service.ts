import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TokenBucket = require('tokenbucket')

@Injectable()
export class RateLimiterService {
  public readonly getDossierMilo: RateLimiter

  constructor(private configService: ConfigService) {
    this.getDossierMilo = this.buildGetDossierMilo()
  }

  private buildGetDossierMilo(): RateLimiter {
    return new RateLimiter({
      size: parseInt(
        this.configService.get('rateLimiter.getDossierMilo.limit')!
      ),
      interval: parseInt(
        this.configService.get('rateLimiter.getDossierMilo.interval')!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get('rateLimiter.getDossierMilo.limit')!
      )
    })
  }
}

export class RateLimiter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tokenBucket: any

  constructor(options: RateLimiter.Options) {
    this.tokenBucket = new TokenBucket(options)
  }

  async attendreLaProchaineDisponibilite(quantity = 1): Promise<void> {
    return this.tokenBucket.removeTokens(quantity)
  }
}

export namespace RateLimiter {
  export interface Options {
    size: number
    tokensToAddPerInterval: number
    interval: number
  }
}
