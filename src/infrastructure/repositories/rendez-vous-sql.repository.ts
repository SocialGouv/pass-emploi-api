import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { RendezVousQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import { RendezVous } from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../sequelize/types'

@Injectable()
export class RendezVousRepositorySql implements RendezVous.Repository {
  constructor(private dateService: DateService) {}

  async add(rendezVous: RendezVous): Promise<void> {
    const rendezVousDto = buildRendezVousDto(rendezVous)
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

    if (!rendezVousSql) {
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
        }
      }
    }
  }

  async getAllQueryModelsByConseiller(
    idConseiller: string
  ): Promise<RendezVousQueryModel[]> {
    const allRendezVousSql = await RendezVousSqlModel.findAll({
      include: [JeuneSqlModel],
      where: {
        idConseiller,
        dateSuppression: {
          [Op.is]: null
        }
      }
    })

    return allRendezVousSql.map(toRendezVousConseillerQueryModel)
  }
}

function buildRendezVousDto(rendezVous: RendezVous): AsSql<RendezVousDto> {
  return {
    id: rendezVous.id,
    titre: rendezVous.titre,
    sousTitre: rendezVous.sousTitre,
    modalite: rendezVous.modalite,
    duree: rendezVous.duree,
    date: rendezVous.date,
    commentaire: rendezVous.commentaire ?? null,
    dateSuppression: null,
    idConseiller: rendezVous.jeune.conseiller.id,
    idJeune: rendezVous.jeune.id
  }
}

function toRendezVousConseillerQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousQueryModel {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    title: `${rendezVousSql.jeune.prenom} ${rendezVousSql.jeune.nom}`,
    date: rendezVousSql.date,
    modality: rendezVousSql.modalite,
    duration: rendezVousSql.duree
  }
}
