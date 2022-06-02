import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Core } from '../../domain/core'
import { Mail } from '../../domain/mail'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'

@Injectable()
export class MailSqlRepository implements Mail.Repository {
  async findAllContactsConseillerByStructure(
    structure: Core.Structure
  ): Promise<Mail.Contact[]> {
    const conseillersSQL = await ConseillerSqlModel.findAll({
      raw: true,
      attributes: ['nom', 'prenom', 'email'],
      where: { [Op.and]: [{ structure }, { email: { [Op.not]: null } }] }
    })
    // Solution plus lisible/maintenable mais moins performante
    const contacts: Mail.Contact[] = conseillersSQL.map(conseillerMiloSQL => ({
      nom: conseillerMiloSQL.nom,
      prenom: conseillerMiloSQL.prenom,
      email: conseillerMiloSQL.email!
    }))
    return contacts
  }

  async countContactsConseillerSansEmail(): Promise<number> {
    return await ConseillerSqlModel.count({ where: { email: null } })
  }
}
