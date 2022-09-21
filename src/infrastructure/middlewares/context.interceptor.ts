import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { catchError, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import {
  AppelPartenaireResultat,
  Context,
  ContextData,
  ContextKey
} from '../../building-blocks/context'
import { Authentification } from '../../domain/authentification'
import { LogApiPartenaireSqlModel } from '../sequelize/models/log-api-partenaire-sql.model'
import * as uuid from 'uuid'
import { getAPMInstance } from '../monitoring/apm.init'
import * as APM from 'elastic-apm-node'

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

    return next.handle().pipe(
      tap(data => {
        // Après l'appel de la route, on récupère le contexte et on le persiste
        this.persisterResultatAppelPartenaire(this.context.get(), data)
      }),
      catchError(_err => {
        this.persisterResultatAppelPartenaire(this.context.get(), {})
        throw _err
      })
    )
  }

  private persisterResultatAppelPartenaire(
    currentContext: ContextData,
    data: unknown
  ): void {
    const persisterResultat = currentContext.get(
      ContextKey.RESULTAT_APPEL_PARTENAIRE
    )
    if (persisterResultat) {
      const utilisateur = currentContext.get(
        ContextKey.UTILISATEUR
      )! as Authentification.Utilisateur
      const res = persisterResultat as AppelPartenaireResultat
      LogApiPartenaireSqlModel.create({
        id: uuid.v4(),
        date: new Date(),
        idUtilisateur: utilisateur.id,
        typeUtilisateur: utilisateur.type,
        pathPartenaire: res.path,
        resultatPartenaire: res.resultat,
        resultat: data,
        transactionId: this.apmService.currentTraceIds['transaction.id']
      }).catch(e => {
        getAPMInstance().captureError(e)
        this.logger.error(e)
      })
    }
  }
}
