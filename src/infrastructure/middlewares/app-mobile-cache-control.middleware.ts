import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AppMobileCacheControlMiddleware implements NestMiddleware {
  private readonly maxAge: number

  constructor(config: ConfigService) {
    this.maxAge = config.get('headers.maxAge')!
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (estUnAppelAppMobile(req)) {
      res.header('Cache-control', `max-age=${this.maxAge}`)
    }
    next()
  }
}

function estUnAppelAppMobile(req: Request): boolean {
  return ['android', 'ios'].includes(req.header('X-Platform') ?? '')
}
