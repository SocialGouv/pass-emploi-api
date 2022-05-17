import { Campagne } from '../../domain/campagne'
import { DateTime } from 'luxon'
import { CampagneSqlModel } from '../sequelize/models/campagne.sql-model'
import { Op } from 'sequelize'

export class CampagneSqlRepository implements Campagne.Repository {
  async getByIntervalOrName(
    dateDebut: DateTime,
    dateFin: DateTime,
    nom: string
  ): Promise<Campagne | undefined> {
    const campagneSqlModel = await CampagneSqlModel.findOne({
      where: {
        [Op.or]: {
          dateDebut: {
            [Op.between]: [dateDebut.toJSDate(), dateFin.toJSDate()]
          },
          dateFin: {
            [Op.between]: [dateDebut.toJSDate(), dateFin.toJSDate()]
          },
          nom
        }
      }
    })

    if (campagneSqlModel) {
      return {
        id: campagneSqlModel.id,
        nom: campagneSqlModel.nom,
        dateFin: DateTime.fromJSDate(campagneSqlModel.dateFin).toUTC(),
        dateDebut: DateTime.fromJSDate(campagneSqlModel.dateDebut).toUTC()
      }
    }

    return undefined
  }

  async save(campagne: Campagne): Promise<void> {
    await CampagneSqlModel.create({ ...campagne })
  }
}
