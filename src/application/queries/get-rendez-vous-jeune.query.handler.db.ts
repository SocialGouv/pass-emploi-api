import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Evenement, EvenementService } from '../../domain/evenement'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../utils/date-service'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'

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
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('GetRendezVousJeuneQueryHandler')
  }

  async handle(
    query: GetRendezVousJeuneQuery
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

    return success(rendezVousSql.map(fromSqlToRendezVousJeuneQueryModel))
  }

  async authorize(
    query: GetRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    query: GetRendezVousJeuneQuery
  ): Promise<void> {
    if (Authentification.Type.CONSEILLER === utilisateur.type) return
    if (query.periode !== RendezVous.Periode.PASSES) {
      await this.evenementService.creer(Evenement.Code.RDV_LISTE, utilisateur)
    }
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
        date: {
          [Op.lt]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        },
        source: RendezVous.Source.PASS_EMPLOI
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
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
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
      where: {
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']]
    })
  }
}
