import {
  emptySuccess,
  failure,
  Result
} from '../../../../building-blocks/types/result'
import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../../../building-blocks/types/domain-error'
import { MiloAction } from '../../../../domain/partenaire/milo/milo.action'

@Injectable()
export class ActionMiloHttpRepository implements MiloAction.Repository {
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKey: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('ActionMiloHttpSqlRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKey = this.configService.get('milo').apiKeyDossier
  }

  async save(action: MiloAction): Promise<Result> {
    try {
      const body = {
        dateDebut: action.dateDebut.toFormat('yyyy-MM-dd'),
        dateFinReelle: action.dateFinReelle.toFormat('yyyy-MM-dd'),
        commentaire: [action.contenu, action.description]
          .join(' - ')
          .slice(0, 255),
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
      this.logger.error(e)
      const erreur = new ErreurHttp(e.response.data?.message, e.response.status)
      return failure(erreur)
    }
  }
}