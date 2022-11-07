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
  ContextKey
} from '../../building-blocks/context'
import { Authentification } from '../../domain/authentification'
import { LogApiPartenaireSqlModel } from '../sequelize/models/log-api-partenaire.sql-model'
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
        this.persisterResultatsAppelPartenaire(data)
      }),
      catchError(_err => {
        this.persisterResultatsAppelPartenaire({})
        throw _err
      })
    )
  }

  private persisterResultatsAppelPartenaire(data: unknown): void {
    const persisterResultats = this.context.get<AppelPartenaireResultat[]>(
      ContextKey.RESULTATS_APPEL_PARTENAIRE
    )
    if (persisterResultats && persisterResultats.length > 0) {
      const utilisateur = this.context.get<Authentification.Utilisateur>(
        ContextKey.UTILISATEUR
      )!
      persisterResultats.forEach(persisterResultat => {
        this.persisterResultatAppelPartenaire(
          persisterResultat,
          utilisateur,
          data
        )
      })
    }
  }

  private persisterResultatAppelPartenaire(
    appelPartenaireResultat: AppelPartenaireResultat,
    utilisateur: Authentification.Utilisateur,
    data: unknown
  ): void {
    LogApiPartenaireSqlModel.create({
      id: uuid.v4(),
      date: new Date(),
      idUtilisateur: utilisateur.id,
      typeUtilisateur: utilisateur.type,
      pathPartenaire: appelPartenaireResultat.path,
      resultatPartenaire: appelPartenaireResultat.resultat,
      resultat: data,
      transactionId: this.apmService.currentTraceIds['transaction.id']
    }).catch(e => {
      getAPMInstance().captureError(e)
      this.logger.error(e)
    })
  }
}
