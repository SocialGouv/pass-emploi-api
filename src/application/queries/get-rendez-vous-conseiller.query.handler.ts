import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { RendezVousConseillerFutursEtPassesQueryModel } from './query-models/rendez-vous.query-models'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { Op } from 'sequelize'
import { DateService } from '../../utils/date-service'
import { fromSqlToRendezVousConseillerQueryModel } from './query-mappers/rendez-vous-milo.mappers'

export interface GetAllRendezVousConseiller extends Query {
  idConseiller: string
  presenceConseiller?: boolean
}

@Injectable()
export class GetAllRendezVousConseillerQueryHandler extends QueryHandler<
  GetAllRendezVousConseiller,
  RendezVousConseillerFutursEtPassesQueryModel
> {
  constructor(
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetAllRendezVousConseillerQueryHandler')
  }

  async handle(
    query: GetAllRendezVousConseiller
  ): Promise<RendezVousConseillerFutursEtPassesQueryModel> {
    const maintenant = this.dateService.nowJs()

    const presenceConseillerCondition: { presenceConseiller?: boolean } = {}
    if (query.presenceConseiller !== undefined) {
      presenceConseillerCondition.presenceConseiller = query.presenceConseiller
    }

    const rendezVousPassesPromise = RendezVousSqlModel.findAll({
      include: [
        { model: JeuneSqlModel, where: { idConseiller: query.idConseiller } }
      ],
      where: {
        date: {
          [Op.lte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        },
        ...presenceConseillerCondition
      },
      order: [['date', 'DESC']]
    })

    const rendezVousFutursPromise = RendezVousSqlModel.findAll({
      include: [
        { model: JeuneSqlModel, where: { idConseiller: query.idConseiller } }
      ],
      where: {
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        },
        ...presenceConseillerCondition
      },
      order: [['date', 'ASC']]
    })

    const [rendezVousPasses, rendezVousFuturs] = await Promise.all([
      rendezVousPassesPromise,
      rendezVousFutursPromise
    ])

    return {
      passes: rendezVousPasses.map(fromSqlToRendezVousConseillerQueryModel),
      futurs: rendezVousFuturs.map(fromSqlToRendezVousConseillerQueryModel)
    }
  }

  async authorize(
    query: GetAllRendezVousConseiller,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
