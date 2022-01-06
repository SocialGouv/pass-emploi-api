import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel
} from '../../application/queries/query-models/rendez-vous.query-models'
import { RendezVous } from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import {
  toRendezVousDto,
  fromSqlToRendezVousConseillerQueryModel,
  fromSqlToRendezVousJeuneQueryModel
} from './mappers/rendez-vous.mappers'

@Injectable()
export class RendezVousRepositorySql implements RendezVous.Repository {
  constructor(private dateService: DateService) {}

  async add(rendezVous: RendezVous): Promise<void> {
    const rendezVousDto = toRendezVousDto(rendezVous)
    await RendezVousSqlModel.upsert(rendezVousDto)
  }

  async delete(idRendezVous: string): Promise<void> {
    await RendezVousSqlModel.update(
      {
        dateSuppression: this.dateService.nowJs()
      },
      {
        where: {
          id: idRendezVous
        }
      }
    )
  }

  async get(idRendezVous: string): Promise<RendezVous | undefined> {
    const rendezVousSql = await RendezVousSqlModel.findByPk(idRendezVous, {
      include: [JeuneSqlModel, ConseillerSqlModel]
    })

    if (!rendezVousSql || rendezVousSql.dateSuppression) {
      return undefined
    }
    return {
      id: rendezVousSql.id,
      titre: rendezVousSql.titre,
      sousTitre: rendezVousSql.sousTitre,
      modalite: rendezVousSql.modalite,
      duree: rendezVousSql.duree,
      date: rendezVousSql.date,
      commentaire: rendezVousSql.commentaire ?? undefined,
      jeune: {
        id: rendezVousSql.jeune.id,
        firstName: rendezVousSql.jeune.prenom,
        lastName: rendezVousSql.jeune.nom,
        creationDate: DateTime.fromJSDate(rendezVousSql.jeune.dateCreation),
        pushNotificationToken:
          rendezVousSql.jeune.pushNotificationToken ?? undefined,
        conseiller: {
          id: rendezVousSql.conseiller.id,
          firstName: rendezVousSql.conseiller.prenom,
          lastName: rendezVousSql.conseiller.nom
        },
        structure: rendezVousSql.jeune.structure
      }
    }
  }

  async getAllQueryModelsByConseiller(
    idConseiller: string
  ): Promise<RendezVousConseillerQueryModel> {
    const maintenant = this.dateService.nowJs()

    const rendezVousPasses = await RendezVousSqlModel.findAll({
      include: [JeuneSqlModel],
      where: {
        idConseiller,
        date: {
          [Op.lte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'DESC']]
    })

    const rendezVousFuturs = await RendezVousSqlModel.findAll({
      include: [JeuneSqlModel],
      where: {
        idConseiller,
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']]
    })

    return {
      passes: rendezVousPasses.map(fromSqlToRendezVousConseillerQueryModel),
      futurs: rendezVousFuturs.map(fromSqlToRendezVousConseillerQueryModel)
    }
  }

  async getAllQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousQueryModel[]> {
    const allRendezVousSql = await RendezVousSqlModel.findAll({
      include: [ConseillerSqlModel],
      where: {
        idJeune,
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']]
    })

    return allRendezVousSql.map(fromSqlToRendezVousJeuneQueryModel)
  }
}
