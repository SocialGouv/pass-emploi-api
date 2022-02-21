import { Injectable, Logger } from '@nestjs/common'
import { Op } from 'sequelize'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Conseiller } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { MailSendinblueClient } from '../clients/mail-sendinblue.client'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { fromSqlToDetailConseillerQueryModel } from './mappers/conseillers.mappers'
import { DateTime } from 'luxon'

@Injectable()
export class ConseillerSqlEmailRepository implements Conseiller.Repository {
  private logger: Logger

  constructor(private mailSendinblueClient: MailSendinblueClient) {
    this.logger = new Logger('ConseillerSqlRepository')
  }

  async existe(
    idConseiller: string,
    structure: Core.Structure
  ): Promise<boolean> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      where: { id: idConseiller, structure }
    })
    return conseillerSqlModel ? true : false
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
      .set({ hour: 0, minute: 0, second: 0 })
      .toJSDate()
    const conseillersSql = await ConseillerSqlModel.findAll({
      where: {
        dateVerificationMessages: {
          [Op.lt]: dateAMinuit
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
        )
      }
    })
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
      email: conseiller.email || null,
      dateVerificationMessages: conseiller.dateVerificationMessages ?? undefined
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
