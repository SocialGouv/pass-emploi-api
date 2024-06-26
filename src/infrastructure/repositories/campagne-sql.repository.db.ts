import { Campagne } from '../../domain/campagne'
import { DateTime } from 'luxon'
import { CampagneSqlModel } from '../sequelize/models/campagne.sql-model'
import { Op } from 'sequelize'
import { ReponseCampagneSqlModel } from '../sequelize/models/reponse-campagne.sql-model'

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
        dateFin: DateTime.fromJSDate(campagneSqlModel.dateFin),
        dateDebut: DateTime.fromJSDate(campagneSqlModel.dateDebut)
      }
    }

    return undefined
  }

  async save(campagne: Campagne): Promise<void> {
    await CampagneSqlModel.create({ ...campagne })
  }

  async saveEvaluation(evaluation: Campagne.Evaluation): Promise<void> {
    const reponse1 = evaluation.reponses.find(
      reponse => reponse.idQuestion == 1
    )

    const reponse2 = evaluation.reponses.find(
      reponse => reponse.idQuestion == 2
    )

    const reponse3 = evaluation.reponses.find(
      reponse => reponse.idQuestion == 3
    )

    const reponse4 = evaluation.reponses.find(
      reponse => reponse.idQuestion == 4
    )

    await ReponseCampagneSqlModel.inserer({
      idJeune: evaluation.jeune.id,
      structureJeune: evaluation.jeune.structure,
      idCampagne: evaluation.idCampagne,
      dateReponse: evaluation.date.toJSDate(),
      dateCreationJeune: evaluation.jeune.dateCreation.toJSDate(),
      reponse1: reponse1!.idReponse.toString(),
      pourquoi1: reponse1!.pourquoi || null,
      reponse2: reponse2?.idReponse.toString() || null,
      pourquoi2: reponse2?.pourquoi || null,
      reponse3: reponse3?.idReponse.toString() || null,
      pourquoi3: reponse3?.pourquoi || null,
      reponse4: reponse4?.idReponse.toString() || null,
      pourquoi4: reponse4?.pourquoi || null
    })
  }

  async get(id: string): Promise<Campagne | undefined> {
    const campagneSqlModel = await CampagneSqlModel.findByPk(id)

    if (!campagneSqlModel) {
      return undefined
    }

    return {
      id: campagneSqlModel.id,
      nom: campagneSqlModel.nom,
      dateDebut: DateTime.fromJSDate(campagneSqlModel.dateDebut),
      dateFin: DateTime.fromJSDate(campagneSqlModel.dateFin)
    }
  }
}
