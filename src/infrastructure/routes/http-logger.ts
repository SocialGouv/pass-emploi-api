import { Injectable, Logger, NestMiddleware } from '@nestjs/common'

import { NextFunction, Request, Response } from 'express'
import { DateTime } from 'luxon'

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP')

  use(request: Request, response: Response, next: NextFunction): void {
    const { method } = request

    const start = DateTime.now()
    response.on('close', () => {
      const { statusCode } = response
      this.logger.log(
        `${method} ${request.route?.path} ${
          start.diffNow().as('millisecond') * -1
        }ms ${statusCode}`
      )
    })

    next()
  }
}
