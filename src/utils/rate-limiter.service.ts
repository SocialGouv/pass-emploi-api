import { Injectable } from '@nestjs/common'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TokenBucket = require('tokenbucket')
const dixAppelsParSeconde: RateLimiter.Options = {
  size: 10,
  interval: 1000,
  tokensToAddPerInterval: 10
}

@Injectable()
export class RateLimiterService {
  public readonly getDossierMilo: RateLimiter

  constructor() {
    this.getDossierMilo = new RateLimiter(dixAppelsParSeconde)
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
