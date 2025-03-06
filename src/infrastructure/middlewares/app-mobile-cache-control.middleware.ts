import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AppMobileCacheControlMiddleware implements NestMiddleware {
  private readonly staleIfErrorSeconds: number
  private readonly maxAgeMobile: number
  private readonly maxAgeReferentiels: number
  private readonly maxAgeCV: number
  private readonly maxAgeSuggestions: number
  private readonly maxAgeMinimal: number
  private readonly staleIfErrorAgeMinimal: number

  constructor(config: ConfigService) {
    this.staleIfErrorSeconds = config.get('headers.staleIfErrorSeconds')!
    this.maxAgeMobile = config.get('headers.maxAgeMobile')!
    this.maxAgeReferentiels = config.get('headers.maxAgeReferentiels')!
    this.maxAgeCV = config.get('headers.maxAgeCV')!
    this.maxAgeSuggestions = config.get('headers.maxAgeSuggestions')!
    this.maxAgeMinimal = config.get('headers.maxAgeMinimal')!
    this.staleIfErrorAgeMinimal = config.get('headers.staleIfErrorAgeMinimal')!
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.url.includes('referentiels')) {
      res.header(
        'Cache-control',
        `max-age=${this.maxAgeReferentiels}, stale-if-error=${this.staleIfErrorSeconds}`
      )
    } else if (req.url.includes('pole-emploi/cv')) {
      res.header(
        'Cache-control',
        `max-age=${this.maxAgeCV}, stale-if-error=${this.staleIfErrorSeconds}`
      )
    } else if (req.url.includes('recherches/suggestions')) {
      res.header(
        'Cache-control',
        `max-age=${this.maxAgeSuggestions}, stale-if-error=${this.staleIfErrorSeconds}`
      )
    } else if (estUnAppelAppMobile(req)) {
      res.header(
        'Cache-control',
        `max-age=${this.maxAgeMobile}, stale-if-error=${this.staleIfErrorSeconds}`
      )
    } else {
      res.header(
        'Cache-control',
        `max-age=${this.maxAgeMinimal}, stale-if-error=${this.staleIfErrorAgeMinimal}`
      )
    }
    next()
  }
}

function estUnAppelAppMobile(req: Request): boolean {
  return ['android', 'ios'].includes(req.header('X-Platform') ?? '')
}
