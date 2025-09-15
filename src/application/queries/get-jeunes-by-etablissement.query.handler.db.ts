import { Inject, Injectable } from '@nestjs/common'
import { Sequelize } from 'sequelize'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Conseiller, ConseillerRepositoryToken } from '../../domain/conseiller'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { JeuneQueryModel } from './query-models/jeunes.query-model'

export interface GetJeunesByEtablissementQuery extends Query {
  idEtablissement: string
}

@Injectable()
export class GetJeunesByEtablissementQueryHandler extends QueryHandler<
  GetJeunesByEtablissementQuery,
  Result<JeuneQueryModel[]>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    @Inject(ConseillerInterAgenceAuthorizer)
    private readonly conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
    @Inject(ConseillerRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository
  ) {
    super('GetJeunesByEtablissementQueryHandler')
  }

  async handle(
    query: GetJeunesByEtablissementQuery
  ): Promise<Result<JeuneQueryModel[]>> {
    const jeunes = await this.getAllQueryModelsByEtablissement(
      query.idEtablissement
    )
    return success(jeunes)
  }

  async authorize(
    { idEtablissement }: GetJeunesByEtablissementQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.autoriserConseillerPourUneAgence(
      idEtablissement,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }

  private async getAllQueryModelsByEtablissement(
    idEtablissement: string
  ): Promise<JeuneQueryModel[]> {
    const sqlJeunes = await JeuneSqlModel.findAll({
      include: [
        {
          model: ConseillerSqlModel,
          required: true,
          where: { idAgence: idEtablissement }
        }
      ],
      order: [
        ['prenom', 'ASC'],
        ['nom', 'ASC']
      ]
    })

    return sqlJeunes.map(jeune => ({
      id: jeune.id,
      firstName: jeune.prenom,
      lastName: jeune.nom,
      idConseiller: jeune.idConseiller!
    }))
  }
}
