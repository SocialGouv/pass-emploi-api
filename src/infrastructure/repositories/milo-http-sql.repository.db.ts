import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../building-blocks/types/result'
import { Milo } from '../../domain/milo'
import { DateService } from '../../utils/date-service'
import { RateLimiterService } from '../../utils/rate-limiter.service'
import { SituationsMiloSqlModel } from '../sequelize/models/situations-milo.sql-model'
import { DossierMiloDto } from './dto/milo.dto'

@Injectable()
export class MiloHttpSqlRepository implements Milo.Repository {
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKeyDossier: string
  private readonly apiKeyCreerJeune: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService
  ) {
    this.logger = new Logger('MiloHttpRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyDossier = this.configService.get('milo').apiKeyDossier
    this.apiKeyCreerJeune = this.configService.get('milo').apiKeyCreerJeune
  }

  async getDossier(idDossier: string): Promise<Result<Milo.Dossier>> {
    try {
      await this.rateLimiterService.getDossierMilo.attendreLaProchaineDisponibilite()
      const dossierDto = await firstValueFrom(
        this.httpService.get<DossierMiloDto>(
          `${this.apiUrl}/dossiers/${idDossier}`,
          {
            headers: { 'X-Gravitee-Api-Key': `${this.apiKeyDossier}` }
          }
        )
      )

      return success({
        id: idDossier,
        prenom: dossierDto.data.prenom,
        nom: dossierDto.data.nomUsage,
        email: dossierDto.data.mail ?? undefined,
        codePostal: dossierDto.data.adresse?.codePostal ?? '',
        dateDeNaissance: dossierDto.data.dateNaissance,
        dateFinCEJ: DateService.fromStringToDateTime(
          dossierDto.data.accompagnementCEJ.dateFinPrevue
        ),
        situations: dossierDto.data.situations.map(situation => {
          return {
            etat: situation.etat,
            categorie: situation.categorieSituation,
            dateFin: situation.dateFin ?? undefined
          }
        })
      })
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status <= 404) {
        const erreur = new ErreurHttp(
          e.response.data?.message,
          e.response.status
        )
        return failure(erreur)
      }
      throw new RuntimeException(e.statusText)
    }
  }

  async creerJeune(
    idDossier: string
  ): Promise<
    Result<{ idAuthentification?: string; existeDejaChezMilo: boolean }>
  > {
    try {
      const response = await firstValueFrom(
        this.httpService.post<string>(
          `${this.apiUrl}/compte-jeune/${idDossier}`,
          {},
          { headers: { 'X-Gravitee-Api-Key': `${this.apiKeyCreerJeune}` } }
        )
      )
      return success({
        idAuthentification: response.data || undefined,
        existeDejaChezMilo: false
      })
    } catch (e) {
      this.logger.error(e)
      this.logger.error(e.response?.data)

      if (e.response?.status >= 400 && e.response?.status <= 404) {
        if (
          e.response.data?.code === 'SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT'
        ) {
          if (e.response.data['id-keycloak']) {
            return success({
              idAuthentification: e.response.data['id-keycloak'],
              existeDejaChezMilo: true
            })
          }
        }
        const erreur = new ErreurHttp(
          e.response.data?.message,
          e.response.status
        )
        return failure(erreur)
      }
      throw new RuntimeException(e.statusText)
    }
  }

  async saveSituationsJeune(situations: Milo.SituationsDuJeune): Promise<void> {
    await SituationsMiloSqlModel.upsert(
      {
        idJeune: situations.idJeune,
        situationCourante: situations.situationCourante,
        situations: situations.situations
      },
      { conflictFields: ['id_jeune'] }
    )
  }

  async getSituationsByJeune(
    idJeune: string
  ): Promise<Milo.SituationsDuJeune | undefined> {
    const situationsSql = await SituationsMiloSqlModel.findOne({
      where: { idJeune }
    })

    return situationsSql
      ? {
        idJeune: situationsSql.idJeune,
        situationCourante: situationsSql.situationCourante ?? undefined,
        situations: situationsSql.situations
      }
      : undefined
  }
}
