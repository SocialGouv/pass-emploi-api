import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Context, ContextData, ContextKey } from '../../building-blocks/context'
import { Authentification } from '../../domain/authentification'
import { LogApiPartenaireSqlModel } from '../sequelize/models/log-api-partenaire-sql.model'
import * as uuid from 'uuid'
import { getAPMInstance } from '../monitoring/apm.init'

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  private logger: Logger

  constructor(private context: Context) {
    this.logger = new Logger('ContextInterceptor')
  }

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    this.context.start()
    const utilisateur = executionContext.switchToHttp().getRequest()
      .authenticated.utilisateur
    this.context.set(ContextKey.UTILISATEUR, utilisateur)

    return next.handle().pipe(
      tap(data => {
        this.persisterResultatAppelPartenaire(this.context.get(), data)
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
      const res = persisterResultat as {
        path: string
        res: object
      }
      LogApiPartenaireSqlModel.create({
        id: uuid.v4(),
        date: new Date(),
        idUtilisateur: utilisateur.id,
        typeUtilisateur: utilisateur.type,
        pathPartenaire: res.path,
        resultatPartenaire: res.res,
        resultat: data,
        transactionId: getAPMInstance().currentTraceIds['transaction.id']
      }).catch(e => {
        getAPMInstance().captureError(e)
        this.logger.error(e)
      })
    }
  }
}
