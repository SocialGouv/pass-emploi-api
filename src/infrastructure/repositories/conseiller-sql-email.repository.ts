import { Injectable, Logger } from '@nestjs/common'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Conseiller } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { fromSqlToDetailConseillerQueryModel } from './mappers/conseillers.mappers'
import { MailSendinblueClient } from '../clients/mail-sendinblue.client'

@Injectable()
export class ConseillerSqlEmailRepository implements Conseiller.Repository {
  private logger: Logger

  constructor(private mailSendinblueClient: MailSendinblueClient) {
    this.logger = new Logger('ConseillerSqlRepository')
  }

  async getAllIds(): Promise<string[]> {
    const rawIds = await ConseillerSqlModel.findAll({
      attributes: ['id']
    })
    return rawIds.map(conseillerSql => conseillerSql.id)
  }

  async get(id: string): Promise<Conseiller | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel) {
      return undefined
    }
    return {
      id: conseillerSqlModel.id,
      firstName: conseillerSqlModel.prenom,
      lastName: conseillerSqlModel.nom,
      structure: conseillerSqlModel.structure,
      email: conseillerSqlModel.email || undefined
    }
  }

  async save(conseiller: Conseiller): Promise<void> {
    await ConseillerSqlModel.upsert({
      id: conseiller.id,
      prenom: conseiller.firstName,
      nom: conseiller.lastName,
      structure: conseiller.structure,
      email: conseiller.email || null
    })
  }

  async getQueryModelById(
    id: string
  ): Promise<DetailConseillerQueryModel | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel) {
      return undefined
    }

    return fromSqlToDetailConseillerQueryModel(conseillerSqlModel)
  }

  async getQueryModelByEmailAndStructure(
    emailConseiller: string,
    structure: Core.Structure
  ): Promise<Result<DetailConseillerQueryModel>> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      where: { email: emailConseiller, structure }
    })
    if (!conseillerSqlModel) {
      return failure(new NonTrouveError('Conseiller', emailConseiller))
    }

    return success(fromSqlToDetailConseillerQueryModel(conseillerSqlModel))
  }

  async envoyerUnRappelParMail(
    idConseiller: string,
    nombreDeConversationNonLues: number
  ): Promise<void> {
    const conseiller = await this.get(idConseiller)

    if (!conseiller || !conseiller?.email) {
      this.logger.warn(
        `Impossible d'envoyer un mail au conseiller ${idConseiller}, il n'existe pas`
      )
    } else {
      await this.mailSendinblueClient.envoyer(
        conseiller,
        nombreDeConversationNonLues
      )
    }
  }
}
