import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { ConseillerSimpleQueryModel } from './query-models/conseillers.query-model'

const NOMBRE_MAX_CONSEILLERS = 10

export interface GetConseillersQuery extends Query {
  recherche: string
  structureUtilisateur: Core.Structure
}

@Injectable()
export class GetConseillersQueryHandler extends QueryHandler<
  GetConseillersQuery,
  Result<ConseillerSimpleQueryModel[]>
> {
  constructor(
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetConseillersQueryHandler')
  }

  async handle({
    recherche,
    structureUtilisateur
  }: GetConseillersQuery): Promise<Result<ConseillerSimpleQueryModel[]>> {
    const conseillersRawSql = await this.sequelize.query<{
      id: string
      nom: string
      prenom: string
      email: string
    }>(
      `SELECT
            conseiller.id as id,
            conseiller.nom as nom,
            conseiller.prenom as prenom,
            conseiller.email as email,
            GREATEST(SIMILARITY(CONCAT(conseiller.nom, ' ', conseiller.prenom), :query), SIMILARITY(conseiller.email, :query)) as greatestScore
      FROM conseiller
      WHERE structure = :structure
        AND GREATEST(SIMILARITY(CONCAT(conseiller.nom, ' ', conseiller.prenom), :query), SIMILARITY(conseiller.email, :query)) > 0.1 
      ORDER BY greatestScore DESC
      LIMIT :limit;`,
      {
        replacements: {
          query: recherche,
          structure: structureUtilisateur,
          limit: NOMBRE_MAX_CONSEILLERS
        },
        type: QueryTypes.SELECT
      }
    )

    return success(
      conseillersRawSql.map(conseillerRawSql => ({
        id: conseillerRawSql.id,
        prenom: conseillerRawSql.prenom,
        nom: conseillerRawSql.nom,
        email: conseillerRawSql.email ?? undefined
      }))
    )
  }

  async authorize(
    _query: GetConseillersQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserConseillerSuperviseur(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
