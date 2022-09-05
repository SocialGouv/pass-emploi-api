import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { RechercheQueryModel } from './query-models/recherches.query-model'
import { FindOptions } from 'sequelize'
import { RechercheSqlModel } from '../../infrastructure/sequelize/models/recherche.sql-model'
import { Result } from '../../building-blocks/types/result'
import { ConseillerForJeuneAvecPartageAuthorizer } from '../authorizers/authorize-conseiller-for-jeune-avec-partage'

export interface GetRecherchesQuery extends Query {
  idJeune: string
  avecGeometrie?: boolean
}

@Injectable()
export class GetRecherchesQueryHandler extends QueryHandler<
  GetRecherchesQuery,
  RechercheQueryModel[]
> {
  constructor(
    private conseillerForJeuneAvecPartageAuthorizer: ConseillerForJeuneAvecPartageAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetRecherchesQueryHandler')
  }

  async handle(query: GetRecherchesQuery): Promise<RechercheQueryModel[]> {
    const options: FindOptions = {
      where: {
        idJeune: query.idJeune
      }
    }

    if (!query.avecGeometrie) {
      options.attributes = {
        exclude: ['geometrie']
      }
    }

    const recherchesSql = await RechercheSqlModel.findAll(options)
    return recherchesSql.map(fromSqlToRechercheQueryModel)
  }

  async authorize(
    query: GetRecherchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerForJeuneAvecPartageAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}

function fromSqlToRechercheQueryModel(
  rechercheSql: RechercheSqlModel
): RechercheQueryModel {
  return {
    id: rechercheSql.id,
    titre: rechercheSql.titre,
    type: rechercheSql.type,
    metier: rechercheSql.metier ?? undefined,
    localisation: rechercheSql.localisation ?? undefined,
    criteres: rechercheSql.criteres ?? undefined,
    geometrie: rechercheSql.geometrie ?? undefined
  }
}
