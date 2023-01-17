import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TokenBucket = require('tokenbucket')
import { RedisClientType as _RedisClientType } from '@redis/client/dist/lib/client'

@Injectable()
export class RateLimiterService {
  public readonly getDossierMilo: RateLimiter
  public readonly getRendezVousMilo: RateLimiter
  public readonly getSessionMilo: RateLimiter
  public readonly getEvenementMilo: RateLimiter
  public readonly getNotificationsPE: RateLimiter
  private readonly redisClient: _RedisClientType

  constructor(private configService: ConfigService) {
    this.redisClient = createClient({
      url: configService.get('redis.url')
    })
    this.getDossierMilo = this.buildGetDossierMilo()
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
      ),
      redis: {
        bucketName: 'DossierMiloRateLimiter',
        redisClient: this.redisClient
      }
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
      ),
      redis: {
        bucketName: 'EvenementMiloRateLimiter',
        redisClient: this.redisClient
      }
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
      ),
      redis: {
        bucketName: 'RendezVousMiloRateLimiter',
        redisClient: this.redisClient
      }
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
      ),
      redis: {
        bucketName: 'SessionMiloRateLimiter',
        redisClient: this.redisClient
      }
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
      ),
      redis: {
        bucketName: 'NotificationPERateLimiter',
        redisClient: this.redisClient
      }
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
    redis: {
      bucketName: string
      redisClient: _RedisClientType
    }
  }
}
