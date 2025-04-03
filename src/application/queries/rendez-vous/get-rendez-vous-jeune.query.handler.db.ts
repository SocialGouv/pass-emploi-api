import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Op } from 'sequelize'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { estMilo } from 'src/domain/core'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { generateSourceRendezVousCondition } from '../../../config/feature-flipping'
import { Authentification } from '../../../domain/authentification'
import { RendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../utils/date-service'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { fromSqlToRendezVousJeuneQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'

export interface GetRendezVousJeuneQuery extends Query {
  idJeune: string
  periode?: RendezVous.Periode
}

@Injectable()
export class GetRendezVousJeuneQueryHandler extends QueryHandler<
  GetRendezVousJeuneQuery,
  Result<RendezVousJeuneQueryModel[]>
> {
  constructor(
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerInterAgenceAuthorizer,
    private configuration: ConfigService
  ) {
    super('GetRendezVousJeuneQueryHandler')
  }

  async handle(
    query: GetRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<RendezVousJeuneQueryModel[]>> {
    let rendezVousSql

    switch (query.periode) {
      case RendezVous.Periode.PASSES:
        rendezVousSql = await this.getRendezVousPassesQueryModelsByJeune(
          query.idJeune
        )
        break
      case RendezVous.Periode.FUTURS:
        rendezVousSql = await this.getRendezVousFutursQueryModelsByJeune(
          query.idJeune
        )
        break
      default:
        rendezVousSql = await this.getAllQueryModelsByJeune(query.idJeune)
    }

    return success(
      rendezVousSql.map(rdvSql =>
        fromSqlToRendezVousJeuneQueryModel(
          rdvSql,
          utilisateur.type,
          query.idJeune
        )
      )
    )
  }

  async authorize(
    query: GetRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      Authentification.estConseiller(utilisateur.type) &&
      estMilo(utilisateur.structure)
    ) {
      return this.conseillerAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        query.idJeune,
        utilisateur
      )
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(): Promise<void> {
    return
  }

  private async getRendezVousPassesQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousSqlModel[]> {
    const maintenant = this.dateService.nowAtMidnightJs()
    return RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: idJeune },
          include: [ConseillerSqlModel]
        }
      ],
      where: {
        ...generateSourceRendezVousCondition(this.configuration),
        date: {
          [Op.lt]: maintenant
        }
      },
      order: [['date', 'DESC']],
      limit: 100
    })
  }

  private async getRendezVousFutursQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousSqlModel[]> {
    const maintenant = this.dateService.nowAtMidnightJs()
    return RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: idJeune },
          include: [ConseillerSqlModel]
        }
      ],
      where: {
        ...generateSourceRendezVousCondition(this.configuration),
        date: {
          [Op.gte]: maintenant
        }
      },
      order: [['date', 'ASC']]
    })
  }

  private async getAllQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousSqlModel[]> {
    return RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: idJeune },
          include: [ConseillerSqlModel]
        }
      ],
      where: generateSourceRendezVousCondition(this.configuration),
      order: [['date', 'ASC']]
    })
  }
}
