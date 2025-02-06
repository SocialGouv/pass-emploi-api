import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { Op } from 'sequelize'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneMiloAArchiverSqlModel } from 'src/infrastructure/sequelize/models/jeune-milo-a-archiver.sql-model'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../../building-blocks/types/result'
import { Core } from '../../../domain/core'
import { JeuneMilo } from '../../../domain/milo/jeune.milo'
import { DateService } from '../../../utils/date-service'
import { RateLimiterService } from '../../../utils/rate-limiter.service'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from '../../sequelize/models/situations-milo.sql-model'
import { StructureMiloSqlModel } from '../../sequelize/models/structure-milo.sql-model'
import { DossierMiloDto } from '../dto/milo.dto'
import { fromSqlToJeune } from '../mappers/jeunes.mappers'

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

  async get(id: string): Promise<Result<JeuneMilo>> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: { id, structure: Core.Structure.MILO },
      include: { model: ConseillerSqlModel, required: false }
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', id))
    }

    const jeuneMilo: JeuneMilo = {
      ...fromSqlToJeune(jeuneSqlModel),
      idStructureMilo: jeuneSqlModel.idStructureMilo ?? undefined
    }
    return success(jeuneMilo)
  }

  async getDossier(idDossier: string): Promise<Result<JeuneMilo.Dossier>> {
    try {
      await this.rateLimiterService.dossierMiloRateLimiter.attendreLaProchaineDisponibilite()
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
        codeStructure: dossierDto.data.structureRattachement?.codeStructure
      })
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status <= 404) {
        const message =
          e.response.status === 400
            ? 'Le numéro de dossier est incorrect. Renseignez un numéro. Exemple : 123456.'
            : e.response.data?.message
        const erreur = new ErreurHttp(message, e.response.status)
        return failure(erreur)
      }
      throw new RuntimeException(e.statusText)
    }
  }

  async getByIdDossier(idDossier: string): Promise<Result<JeuneMilo>> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: { idPartenaire: idDossier }
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Dossier Milo', idDossier))
    }
    const jeuneMilo: JeuneMilo = {
      ...fromSqlToJeune(jeuneSqlModel),
      idStructureMilo: jeuneSqlModel.idStructureMilo ?? undefined
    }
    return success(jeuneMilo)
  }

  async creerJeune(
    idDossier: string,
    surcharge?: boolean
  ): Promise<
    Result<{ idAuthentification?: string; existeDejaChezMilo: boolean }>
  > {
    let response
    try {
      response = await firstValueFrom(
        surcharge
          ? this.httpService.put<string>(
              `${this.apiUrl}/sue/compte-jeune/surcharge/${idDossier}`,
              {},
              { headers: { 'X-Gravitee-Api-Key': `${this.apiKeyCreerJeune}` } }
            )
          : this.httpService.post<string>(
              `${this.apiUrl}/sue/compte-jeune/${idDossier}`,
              {},
              { headers: { 'X-Gravitee-Api-Key': `${this.apiKeyCreerJeune}` } }
            )
      )
      if (surcharge && !response.data) {
        response = await firstValueFrom(
          this.httpService.post<string>(
            `${this.apiUrl}/sue/compte-jeune/${idDossier}`,
            {},
            { headers: { 'X-Gravitee-Api-Key': `${this.apiKeyCreerJeune}` } }
          )
        )
      }
      return success({
        idAuthentification: response.data || undefined,
        existeDejaChezMilo: false
      })
    } catch (e) {
      this.logger.error(e)
      this.logger.error(e.response?.data)

      if (e.response.data?.code === 'SUE_ACCOUNT_EXISTING_OTHER_ML') {
        return failure(new ErreurHttp(e.response.data?.message, 422))
      }

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

  async getJeunesMiloAvecIdDossier(
    offset: number,
    limit: number
  ): Promise<JeuneMilo[]> {
    const jeunesMiloSqlModel = await JeuneSqlModel.findAll({
      where: {
        structure: Core.Structure.MILO,
        idPartenaire: { [Op.ne]: null }
      },
      order: [['id', 'ASC']],
      offset,
      limit
    })

    return jeunesMiloSqlModel.map(jeuneSqlModel => {
      const jeuneMilo: JeuneMilo = {
        ...fromSqlToJeune(jeuneSqlModel),
        idStructureMilo: jeuneSqlModel.idStructureMilo ?? undefined
      }
      return jeuneMilo
    })
  }

  async save(
    jeune: JeuneMilo,
    codeStructureMilo?: string | null,
    dateFinCEJ?: DateTime | null
  ): Promise<void> {
    let nouveauCodeStructure = codeStructureMilo

    if (
      nouveauCodeStructure &&
      nouveauCodeStructure !== jeune.idStructureMilo
    ) {
      const structureSql = await StructureMiloSqlModel.findByPk(
        nouveauCodeStructure
      )
      if (!structureSql) {
        nouveauCodeStructure = null
      }
    }

    await JeuneSqlModel.update(
      {
        dateFinCEJ: dateFinCEJ && dateFinCEJ.toJSDate(),
        idStructureMilo: nouveauCodeStructure
      },
      { where: { id: jeune.id } }
    )
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

  async marquerAARchiver(id: string, aArchiver: boolean): Promise<void> {
    if (aArchiver) await JeuneMiloAArchiverSqlModel.upsert({ idJeune: id })
    else await JeuneMiloAArchiverSqlModel.destroy({ where: { idJeune: id } })
  }
}
