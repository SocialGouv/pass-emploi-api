import { DynamicModule } from '@nestjs/common'
import { Request } from 'express'
import { IncomingMessage } from 'http'
import { LoggerModule } from 'nestjs-pino'
import { MixinFn } from 'pino'
import { ReqId } from 'pino-http'
import * as uuid from 'uuid'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'

export const configureLoggerModule = (): DynamicModule =>
  LoggerModule.forRoot({
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    pinoHttp: [
      {
        autoLogging: {
          ignore: (req: IncomingMessage): boolean => {
            if (req.url?.endsWith('/health')) {
              return true
            }
            return false
          }
        },
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]'
        ],
        mixin: (): (() => MixinFn) => {
          const currentTraceIds = getAPMInstance().currentTraceIds
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore
          return !Object.keys(currentTraceIds).length ? {} : { currentTraceIds }
        },
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

export interface LogError {
  message: string
  err: Error
}

export function buildError(message: string, error: Error): LogError {
  return {
    message,
    err: error
  }
}
