import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TokenBucket = require('tokenbucket')

@Injectable()
export class RateLimiterService {
  public readonly getDossierMilo: RateLimiter
  public readonly getReferentielStructuresMilo: RateLimiter
  public readonly getRendezVousMilo: RateLimiter
  public readonly getSessionMilo: RateLimiter
  public readonly getEvenementMilo: RateLimiter
  public readonly getNotificationsPE: RateLimiter

  constructor(private configService: ConfigService) {
    this.getDossierMilo = this.buildGetDossierMilo()
    this.getReferentielStructuresMilo = this.buildGetReferentielStructuresMilo()
    this.getEvenementMilo = this.buildGetEvenementMilo()
    this.getRendezVousMilo = this.buildGetRendezVousMilo()
    this.getSessionMilo = this.buildGetSessionMilo()
    this.getNotificationsPE = this.buildGetNotificationsPE()
  }

  private buildGetDossierMilo(): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(
        this.configService.get('rateLimiter.getDossierMilo.limit')!
      ),
      interval: parseInt(
        this.configService.get('rateLimiter.getDossierMilo.interval')!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get('rateLimiter.getDossierMilo.limit')!
      )
    }
    return new RateLimiter(options)
  }

  private buildGetReferentielStructuresMilo(): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(
        this.configService.get(
          'rateLimiter.getReferentielStructuresMilo.limit'
        )!
      ),
      interval: parseInt(
        this.configService.get(
          'rateLimiter.getReferentielStructuresMilo.interval'
        )!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get(
          'rateLimiter.getReferentielStructuresMilo.limit'
        )!
      )
    }
    return new RateLimiter(options)
  }

  private buildGetEvenementMilo(): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(
        this.configService.get('rateLimiter.getAckEvenementMilo.limit')!
      ),
      interval: parseInt(
        this.configService.get('rateLimiter.getAckEvenementMilo.interval')!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get('rateLimiter.getAckEvenementMilo.limit')!
      )
    }
    return new RateLimiter(options)
  }

  private buildGetRendezVousMilo(): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(
        this.configService.get('rateLimiter.getRendezVousMilo.limit')!
      ),
      interval: parseInt(
        this.configService.get('rateLimiter.getRendezVousMilo.interval')!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get('rateLimiter.getRendezVousMilo.limit')!
      )
    }
    return new RateLimiter(options)
  }

  private buildGetSessionMilo(): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(
        this.configService.get('rateLimiter.getSessionMilo.limit')!
      ),
      interval: parseInt(
        this.configService.get('rateLimiter.getSessionMilo.interval')!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get('rateLimiter.getSessionMilo.limit')!
      )
    }
    return new RateLimiter(options)
  }

  private buildGetNotificationsPE(): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(
        this.configService.get('rateLimiter.getNotificationsPE.limit')!
      ),
      interval: parseInt(
        this.configService.get('rateLimiter.getNotificationsPE.interval')!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get('rateLimiter.getNotificationsPE.limit')!
      )
    }
    return new RateLimiter(options)
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
