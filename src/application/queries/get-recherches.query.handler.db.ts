import { Injectable } from '@nestjs/common'
import { FindOptions } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { RechercheSqlModel } from '../../infrastructure/sequelize/models/recherche.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { fromSqlToRechercheQueryModel } from './query-mappers/recherche.mapper'
import { RechercheQueryModel } from './query-models/recherches.query-model'

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
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
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
    if (Authentification.estConseiller(utilisateur.type)) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMiloAvecPartageFavoris(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
