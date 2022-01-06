import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { firstValueFrom } from 'rxjs'
import { ErreurHttpMilo } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { Milo } from '../../domain/milo'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { DossierMiloDto } from './dto/milo.dto'

@Injectable()
export class MiloHttpRepository implements Milo.Repository {
  private logger: Logger
  private apiUrl: string
  private apiKeyRecupererDossier: string
  private apiKeyCreerJeune: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MiloHttpRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyRecupererDossier =
      this.configService.get('milo').apiKeyRecupererDossier
    this.apiKeyCreerJeune = this.configService.get('milo').apiKeyCreerJeune
  }

  async getDossier(idDossier: string): Promise<Result<Milo.Dossier>> {
    try {
      const dossierDto = await firstValueFrom(
        this.httpService.get<DossierMiloDto>(
          `${this.apiUrl}/dossiers/${idDossier}`,
          {
            headers: { 'X-Gravitee-Api-Key': `${this.apiKeyRecupererDossier}` }
          }
        )
      )

      return success({
        id: idDossier,
        prenom: dossierDto.data.prenom,
        nom: dossierDto.data.nomUsage,
        email: dossierDto.data.mail ?? undefined,
        codePostal: dossierDto.data.adresse?.codePostal ?? '',
        dateDeNaissance: dossierDto.data.dateNaissance
      })
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status <= 404) {
        const erreur = new ErreurHttpMilo(
          e.response.data?.message,
          e.response.status
        )
        return failure(erreur)
      }
      throw new RuntimeException(e.statusText)
    }
  }

  async creerJeune(idDossier: string, email: string): Promise<Result> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/compte-jeune/${idDossier}`,
          {},
          { headers: { 'X-Gravitee-Api-Key': `${this.apiKeyCreerJeune}` } }
        )
      )
      return emptySuccess()
    } catch (e) {
      this.logger.error(e)

      if (e.response?.status >= 400 && e.response?.status <= 404) {
        if (
          e.response.data?.code === 'SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT'
        ) {
          const jeuneExistant = await JeuneSqlModel.findOne({
            attributes: ['id'],
            where: {
              email,
              structure: Core.Structure.MILO
            }
          })

          if (jeuneExistant) {
            return failure(
              new ErreurHttpMilo(e.response.data?.message, e.response.status)
            )
          } else {
            return emptySuccess()
          }
        }
        const erreur = new ErreurHttpMilo(
          e.response.data?.message,
          e.response.status
        )
        return failure(erreur)
      }
      throw new RuntimeException(e.statusText)
    }
  }
}
