import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Core } from '../../domain/core'
import { Mail } from '../../domain/mail'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'

@Injectable()
export class MailSqlRepository implements Mail.Repository {
  async findAllContactsConseillerByStructures(
    structures: Core.Structure[]
  ): Promise<Mail.Contact[]> {
    const conseillersSQL = await ConseillerSqlModel.findAll({
      raw: true,
      attributes: ['nom', 'prenom', 'email'],
      where: {
        [Op.and]: [
          { structure: { [Op.in]: structures } },
          { email: { [Op.not]: null } }
        ]
      }
    })
    // Solution plus lisible/maintenable mais moins performante
    const contacts: Mail.Contact[] = conseillersSQL.map(conseillerSQL => ({
      nom: conseillerSQL.nom,
      prenom: conseillerSQL.prenom,
      email: conseillerSQL.email!.replace(/pole-emploi/g, 'francetravail')
    }))
    return contacts
  }

  async countContactsConseillerSansEmail(): Promise<number> {
    return ConseillerSqlModel.count({ where: { email: null } })
  }
}
