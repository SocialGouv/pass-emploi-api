import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { Observable } from 'rxjs'
import { Context, ContextKey } from '../../building-blocks/context'
import { getAPMInstance } from '../monitoring/apm.init'

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  private logger: Logger
  private apmService: APM.Agent

  constructor(private context: Context) {
    this.apmService = getAPMInstance()
    this.logger = new Logger('ContextInterceptor')
  }

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    this.context.start()

    // Récupération de l'utilisateur avant l'appel de la route. cf: https://docs.nestjs.com/interceptors#interceptors
    const utilisateur = executionContext.switchToHttp().getRequest()
      .authenticated?.utilisateur
    this.context.set(ContextKey.UTILISATEUR, utilisateur)

    return next.handle().pipe()
  }
}
