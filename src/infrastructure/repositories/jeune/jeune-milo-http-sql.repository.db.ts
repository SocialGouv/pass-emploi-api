import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../../building-blocks/types/result'
import { JeuneMilo } from '../../../domain/milo/jeune.milo'
import { DateService } from '../../../utils/date-service'
import { RateLimiterService } from '../../../utils/rate-limiter.service'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from '../../sequelize/models/situations-milo.sql-model'
import { StructureMiloSqlModel } from '../../sequelize/models/structure-milo.sql-model'
import { DossierMiloDto } from '../dto/milo.dto'

@Injectable()
export class MiloJeuneHttpSqlRepository implements JeuneMilo.Repository {
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

  async getDossier(idDossier: string): Promise<Result<JeuneMilo.Dossier>> {
    try {
      await this.rateLimiterService.getDossierMilo.attendreLaProchaineDisponibilite()
      const dossierDto = await firstValueFrom(
        this.httpService.get<DossierMiloDto>(
          `${this.apiUrl}/sue/dossiers/${idDossier}`,
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
        }),
        nomStructure: dossierDto.data.structureRattachement.nomOfficiel
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
          `${this.apiUrl}/sue/compte-jeune/${idDossier}`,
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

  async saveSituationsJeune(situations: JeuneMilo.Situations): Promise<void> {
    await SituationsMiloSqlModel.upsert(
      {
        idJeune: situations.idJeune,
        situationCourante: situations.situationCourante,
        situations: situations.situations
      },
      { conflictFields: ['id_jeune'] }
    )
  }

  async saveStructureJeune(
    idJeune: string,
    nomOfficielStructureMilo: string
  ): Promise<void> {
    const structureSql = await StructureMiloSqlModel.findOne({
      where: {
        nomOfficiel: nomOfficielStructureMilo
      }
    })

    if (structureSql) {
      await JeuneSqlModel.update(
        {
          idStructureMilo: structureSql.id
        },
        { where: { id: idJeune } }
      )
    }
  }

  async getSituationsByJeune(
    idJeune: string
  ): Promise<JeuneMilo.Situations | undefined> {
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
