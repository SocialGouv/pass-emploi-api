import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerInterStructureMiloAuthorizer } from '../authorizers/conseiller-inter-structure-milo-authorizer'
import { JeuneQueryModel } from './query-models/jeunes.query-model'

export interface GetJeunesByStructureMiloQuery extends Query {
  idStructureMilo: string
}

@Injectable()
export class GetJeunesByStructureMiloQueryHandler extends QueryHandler<
  GetJeunesByStructureMiloQuery,
  Result<JeuneQueryModel[]>
> {
  constructor(
    private readonly conseillerAgenceAuthorizer: ConseillerInterStructureMiloAuthorizer
  ) {
    super('GetJeunesByStructureMiloQueryHandler')
  }

  async handle(
    query: GetJeunesByStructureMiloQuery
  ): Promise<Result<JeuneQueryModel[]>> {
    const sqlJeunes = await JeuneSqlModel.findAll({
      include: [
        {
          model: ConseillerSqlModel,
          required: true,
          where: { idStructureMilo: query.idStructureMilo }
        }
      ],
      order: [
        ['prenom', 'ASC'],
        ['nom', 'ASC']
      ]
    })
    return success(
      sqlJeunes.map(jeune => ({
        id: jeune.id,
        firstName: jeune.prenom,
        lastName: jeune.nom,
        idConseiller: jeune.idConseiller!
      }))
    )
  }

  async authorize(
    query: GetJeunesByStructureMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.autoriserConseillerPourUneStructureMilo(
      query.idStructureMilo,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
