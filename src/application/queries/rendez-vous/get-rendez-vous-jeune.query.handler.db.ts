import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { estMilo } from 'src/domain/core'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { fromSqlToRendezVousJeuneQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'

export interface GetRendezVousJeuneQuery extends Query {
  idJeune: string
  dateDebut: string
  dateFin: string
}

@Injectable()
export class GetRendezVousJeuneQueryHandler extends QueryHandler<
  GetRendezVousJeuneQuery,
  Result<RendezVousJeuneQueryModel[]>
> {
  constructor(private conseillerAuthorizer: ConseillerInterAgenceAuthorizer) {
    super('GetRendezVousJeuneQueryHandler')
  }

  async handle(
    query: GetRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<RendezVousJeuneQueryModel[]>> {
    const rendezVousSql = await this.getQueryModelsInPeriodeByJeune(query)

    return success(
      rendezVousSql.map(rdvSql =>
        fromSqlToRendezVousJeuneQueryModel(
          rdvSql,
          utilisateur.type,
          query.idJeune
        )
      )
    )
  }

  async authorize(
    query: GetRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      Authentification.estConseiller(utilisateur.type) &&
      estMilo(utilisateur.structure)
    ) {
      return this.conseillerAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        query.idJeune,
        utilisateur
      )
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(): Promise<void> {
    return
  }

  private async getQueryModelsInPeriodeByJeune(
    query: GetRendezVousJeuneQuery
  ): Promise<RendezVousSqlModel[]> {
    return RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: query.idJeune },
          required: true,
          include: [ConseillerSqlModel]
        }
      ],
      where: { date: { [Op.between]: [query.dateDebut, query.dateFin] } },
      order: [['date', 'ASC']]
    })
  }
}
