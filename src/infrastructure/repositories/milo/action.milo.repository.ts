import {
  emptySuccess,
  failure,
  Result
} from '../../../building-blocks/types/result'
import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { ActionMilo } from '../../../domain/milo/action.milo'
import { RateLimiterService } from '../../../utils/rate-limiter.service'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../../monitoring/apm.init'

@Injectable()
export class ActionMiloHttpRepository implements ActionMilo.Repository {
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly apmService: APM.Agent

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService
  ) {
    this.logger = new Logger('ActionMiloHttpSqlRepository')
    this.apmService = getAPMInstance()
    this.apiUrl = this.configService.get('milo').url
    this.apiKey = this.configService.get('milo').apiKeyDossier
  }

  async save(action: ActionMilo): Promise<Result> {
    try {
      await this.rateLimiterService.dossierMiloRateLimiter.attendreLaProchaineDisponibilite()

      const body = {
        dateDebut: action.dateDebut.toFormat('yyyy-MM-dd'),
        dateFinReelle: action.dateFinReelle.toFormat('yyyy-MM-dd'),
        commentaire: action.qualification.commentaire,
        mesure: action.qualification.code,
        loginConseiller: action.loginConseiller
      }
      await firstValueFrom(
        this.httpService.post<string>(
          `${this.apiUrl}/sue/dossiers/${action.idDossier}/situation`,
          body,
          { headers: { 'X-Gravitee-Api-Key': `${this.apiKey}` } }
        )
      )

      this.logger.log(
        `SNP créée pour le dossier ${action.idDossier} : ${JSON.stringify(
          body
        )}`
      )

      return emptySuccess()
    } catch (e) {
      this.apmService.captureError(e)
      this.logger.error(e)

      // requete aboutie mais le serveur répond avec statut hors 2XX
      if (e.response) {
        const erreur = new ErreurHttp(
          e.response.data?.message ?? 'Erreur API MILO qualification',
          e.response.status
        )
        return failure(erreur)
      }
      throw e
    }
  }
}
