import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TokenBucket = require('tokenbucket')

@Injectable()
export class RateLimiterService {
  public readonly dossierMiloRateLimiter: RateLimiter
  public readonly evenementsMiloRateLimiter: RateLimiter
  public readonly dossierSessionRDVMiloRateLimiter: RateLimiter
  public readonly sessionsStructureMiloRateLimiter: RateLimiter
  public readonly sessionsConseillerMiloRateLimiter: RateLimiter
  public readonly sessionsJeuneMiloRateLimiter: RateLimiter
  public readonly structuresMiloRateLimiter: RateLimiter
  public readonly notificationsPERateLimiter: RateLimiter
  public readonly matomoRateLimiter: RateLimiter
  public readonly evenementsEngagementRateLimiter: RateLimiter

  constructor(private configService: ConfigService) {
    this.dossierMiloRateLimiter = this.buildRateLimit('dossierMilo')
    this.evenementsMiloRateLimiter = this.buildRateLimit('evenementsMilo')
    this.dossierSessionRDVMiloRateLimiter = this.buildRateLimit(
      'dossierSessionRDVMilo'
    )
    this.sessionsStructureMiloRateLimiter = this.buildRateLimit(
      'sessionsStructureMilo'
    )
    this.sessionsConseillerMiloRateLimiter = this.buildRateLimit(
      'sessionsConseillerMilo'
    )
    this.sessionsJeuneMiloRateLimiter = this.buildRateLimit('sessionsJeuneMilo')
    this.structuresMiloRateLimiter = this.buildRateLimit('structuresMilo')
    this.notificationsPERateLimiter = this.buildRateLimit('notificationsPE')
    this.matomoRateLimiter = this.buildRateLimit('matomo')
    this.evenementsEngagementRateLimiter = this.buildRateLimit(
      'evenementsEngagement'
    )
  }

  private buildRateLimit(configKey: string): RateLimiter {
    const options: RateLimiter.Options = {
      size: parseInt(this.configService.get(`rateLimiter.${configKey}.limit`)!),
      interval: parseInt(
        this.configService.get(`rateLimiter.${configKey}.interval`)!
      ),
      tokensToAddPerInterval: parseInt(
        this.configService.get(`rateLimiter.${configKey}.limit`)!
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
