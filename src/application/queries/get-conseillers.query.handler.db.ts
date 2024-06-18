import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { QueryTypes, Sequelize } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, failure, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { ConseillerSimpleQueryModel } from './query-models/conseillers.query-model'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'

export interface GetConseillersQuery extends Query {
  recherche: string
  structureDifferenteRecherchee?: Core.StructuresPoleEmploi
}

@Injectable()
export class GetConseillersQueryHandler extends QueryHandler<
  GetConseillersQuery,
  Result<ConseillerSimpleQueryModel[]>
> {
  constructor(
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private readonly confiService: ConfigService
  ) {
    super('GetConseillersQueryHandler')
  }

  async handle(
    { recherche, structureDifferenteRecherchee }: GetConseillersQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<ConseillerSimpleQueryModel[]>> {
    if (
      structureDifferenteRecherchee &&
      !Authentification.estSuperviseurPEBRSA(utilisateur)
    ) {
      return failure(new DroitsInsuffisants())
    }

    const structure = structureDifferenteRecherchee ?? utilisateur.structure

    const conseillersRawSql = await this.sequelize.query<{
      id: string
      nom: string
      prenom: string
      email: string
      greatestscore: number
    }>(
      `SELECT
            conseiller.id as id,
            conseiller.nom as nom,
            conseiller.prenom as prenom,
            conseiller.email as email,
            GREATEST(SIMILARITY(CONCAT(conseiller.nom, ' ', conseiller.prenom), :query), SIMILARITY(conseiller.email, :queryPE), SIMILARITY(conseiller.email, :queryFT)) as greatestscore
      FROM conseiller
      WHERE structure = :structure
        AND GREATEST(SIMILARITY(CONCAT(conseiller.nom, ' ', conseiller.prenom), :query), SIMILARITY(conseiller.email, :queryPE), SIMILARITY(conseiller.email, :queryFT)) > 0.1 
      ORDER BY greatestscore DESC
      LIMIT :limit;`,
      {
        replacements: {
          query: recherche,
          queryPE: recherche.replace(/@francetravail.fr/g, '@pole-emploi.fr'),
          queryFT: recherche.replace(/@pole-emploi.fr/g, '@francetravail.fr'),
          structure,
          limit: this.confiService.get('values.maxRechercheConseillers')
        },
        type: QueryTypes.SELECT
      }
    )

    if (conseillersRawSql.length && conseillersRawSql[0].greatestscore === 1)
      return success([sqlToQueryModel(conseillersRawSql[0])])
    return success(conseillersRawSql.map(sqlToQueryModel))
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

function sqlToQueryModel(conseillerRawSql: {
  id: string
  nom: string
  prenom: string
  email: string
}): ConseillerSimpleQueryModel {
  return {
    id: conseillerRawSql.id,
    prenom: conseillerRawSql.prenom,
    nom: conseillerRawSql.nom,
    email: conseillerRawSql.email ?? undefined
  }
}
