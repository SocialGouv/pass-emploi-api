import { DynamicModule } from '@nestjs/common'
import { Request } from 'express'
import { LoggerModule } from 'nestjs-pino'
import { ReqId } from 'pino-http'
import * as uuid from 'uuid'

export const configureLoggerModule = (): DynamicModule =>
  LoggerModule.forRoot({
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    pinoHttp: [
      {
        formatters: {
          level(label): object {
            return { level: label }
          }
        },
        genReqId: (request: Request): ReqId =>
          request.header('X-Request-ID') ?? uuid.v4()
      }
    ]
  })
