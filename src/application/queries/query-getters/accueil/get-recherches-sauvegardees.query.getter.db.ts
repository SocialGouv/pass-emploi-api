import { Injectable, Logger } from '@nestjs/common'
import { RechercheSqlModel } from '../../../../infrastructure/sequelize/models/recherche.sql-model'
import { fromSqlToRechercheQueryModel } from '../../query-mappers/recherche.mapper'
import { RechercheQueryModel } from '../../query-models/recherches.query-model'

export interface GetRecherchesSauvegardeesQuery {
  idJeune: string
}

@Injectable()
export class GetRecherchesSauvegardeesQueryGetter {
  private logger: Logger
  constructor() {
    this.logger = new Logger('GetRecherchesSauvegardeesQueryGetter')
  }

  async handle(
    query: GetRecherchesSauvegardeesQuery
  ): Promise<RechercheQueryModel[]> {
    const recherchesSqlModels = await RechercheSqlModel.findAll({
      where: {
        id_jeune: query.idJeune
      },
      order: [['date_creation', 'DESC']],
      limit: 3
    })

    return recherchesSqlModels.map(recherche =>
      fromSqlToRechercheQueryModel(recherche)
    )
  }
}
