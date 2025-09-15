import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Conseiller } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { AgenceSqlModel } from '../sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'

@Injectable()
export class ConseillerSqlRepository implements Conseiller.Repository {
  async existe(
    idConseiller: string,
    structure: Core.Structure
  ): Promise<boolean> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      where: {
        id: idConseiller,
        structure
      }
    })
    return !!conseillerSqlModel
  }

  async getAllIds(): Promise<string[]> {
    const rawIds = await ConseillerSqlModel.findAll({
      attributes: ['id']
    })
    return rawIds.map(conseillerSql => conseillerSql.id)
  }

  async findConseillersMessagesNonVerifies(
    nombreConseillers: number,
    dateVerification: DateTime
  ): Promise<Conseiller[]> {
    const dateAMinuit = dateVerification
      .set({
        hour: 0,
        minute: 0,
        second: 0
      })
      .toJSDate()
    const conseillersSql = await ConseillerSqlModel.findAll({
      where: {
        dateVerificationMessages: {
          [Op.lt]: dateAMinuit
        },
        dateDerniereConnexion: {
          [Op.gt]: dateVerification.minus({ months: 3 }).toJSDate()
        },
        email: {
          [Op.ne]: null
        }
      },
      limit: nombreConseillers
    })

    return conseillersSql.map(conseillerSql => {
      return {
        id: conseillerSql.id,
        firstName: conseillerSql.prenom,
        lastName: conseillerSql.nom,
        structure: conseillerSql.structure,
        email: conseillerSql.email ?? undefined,
        dateVerificationMessages: DateTime.fromJSDate(
          conseillerSql.dateVerificationMessages
        ),
        notificationsSonores: conseillerSql.notificationsSonores
      }
    })
  }

  async get(id: string): Promise<Conseiller | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id, {
      include: [AgenceSqlModel]
    })
    if (!conseillerSqlModel) {
      return undefined
    }
    return fromSqlConseillerToAggregate(conseillerSqlModel)
  }

  async getByIdAuthentification(
    idAuthentification: string
  ): Promise<Conseiller | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      where: { idAuthentification },
      include: [AgenceSqlModel]
    })
    if (!conseillerSqlModel) {
      return undefined
    }
    return fromSqlConseillerToAggregate(conseillerSqlModel)
  }

  async save(conseiller: Conseiller): Promise<void> {
    await ConseillerSqlModel.upsert({
      id: conseiller.id,
      prenom: conseiller.firstName,
      nom: conseiller.lastName,
      structure: conseiller.structure,
      email: conseiller.email || null,
      dateVerificationMessages:
        conseiller.dateVerificationMessages ?? undefined,
      dateSignatureCGU: conseiller.dateSignatureCGU?.toJSDate() ?? null,
      dateVisionnageActus: conseiller.dateVisionnageActus?.toJSDate() ?? null,
      idAgence: conseiller.agence?.id ?? null,
      nomManuelAgence:
        !conseiller.agence?.id && conseiller.agence?.nom
          ? conseiller.agence.nom
          : null,
      notificationsSonores: conseiller.notificationsSonores
    })
  }

  async updateDateVerificationMessages(
    idconseiller: string,
    dateVerification: Date
  ): Promise<void> {
    await ConseillerSqlModel.update(
      {
        dateVerificationMessages: dateVerification
      },
      { where: { id: idconseiller } }
    )
  }

  async delete(idConseiller: string): Promise<void> {
    await ConseillerSqlModel.destroy({ where: { id: idConseiller } })
  }
}

export function fromSqlConseillerToAggregate(
  conseillerSqlModel: ConseillerSqlModel
): Conseiller {
  const conseiller: Conseiller = {
    id: conseillerSqlModel.id,
    firstName: conseillerSqlModel.prenom,
    lastName: conseillerSqlModel.nom,
    structure: conseillerSqlModel.structure,
    email: conseillerSqlModel.email || undefined,
    agence: conseillerSqlModel.agence,
    notificationsSonores: conseillerSqlModel.notificationsSonores
  }
  if (conseillerSqlModel.agence) {
    conseiller.agence = {
      id: conseillerSqlModel.agence.id,
      nom: conseillerSqlModel.agence.nomAgence
    }
  } else if (conseillerSqlModel.nomManuelAgence) {
    conseiller.agence = {
      id: undefined,
      nom: conseillerSqlModel.nomManuelAgence
    }
  }

  if (conseillerSqlModel.dateSignatureCGU) {
    conseiller.dateSignatureCGU = DateTime.fromJSDate(
      conseillerSqlModel.dateSignatureCGU
    )
  }

  return conseiller
}
