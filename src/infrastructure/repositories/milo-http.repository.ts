import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { firstValueFrom } from 'rxjs'
import {
  EmailMiloDejaUtilise,
  ErreurCreationMilo
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
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

  async getDossier(idDossier: string): Promise<Milo.Dossier | undefined> {
    try {
      const dossierDto = await firstValueFrom(
        this.httpService.get<DossierMiloDto>(
          `${this.apiUrl}/dossiers/${idDossier}`,
          {
            headers: { 'X-Gravitee-Api-Key': `${this.apiKeyRecupererDossier}` }
          }
        )
      )

      return {
        id: idDossier,
        prenom: dossierDto.data.prenom,
        nom: dossierDto.data.nomUsage,
        email: dossierDto.data.mail ?? undefined,
        codePostal: dossierDto.data.adresse?.codePostal ?? '',
        dateDeNaissance: dossierDto.data.dateNaissance
      }
    } catch (e) {
      if (e.response.status === 404) {
        return undefined
      }

      this.logger.error(e.statusText)
      throw new RuntimeException(e.statusText)
    }
  }

  async creerJeune(idDossier: string, email: string): Promise<Result> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/compte-jeune/${idDossier}`, {
          headers: { 'X-Gravitee-Api-Key': `${this.apiKeyCreerJeune}` }
        })
      )
      return emptySuccess()
    } catch (e) {
      this.logger.error(e.response.code)

      if (e.response.status === 400) {
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
            return failure(new EmailMiloDejaUtilise(email))
          } else {
            return emptySuccess()
          }
        }
      }

      this.logger.error(e.response.code)
      return failure(new ErreurCreationMilo(e.response.data?.code))
    }
  }
}
