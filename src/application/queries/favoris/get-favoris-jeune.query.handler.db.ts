import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { WhereOptions } from 'sequelize/types/model'
import { compareDateCreationAntechronologique } from 'src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import {
  fromOffreEmploiSqlToFavorisQueryModel,
  fromOffreImmersionSqlToFavorisQueryModel,
  fromOffreServiceCiviqueSqlToFavorisQueryModel
} from '../query-mappers/favoris.mappers'
import { FavorisQueryModel } from '../query-models/favoris.query-model'

export interface GetFavorisJeuneQuery extends Query {
  idJeune: string
  dateDebut?: DateTime
  dateFin?: DateTime
}

@Injectable()
export class GetFavorisJeuneQueryHandler extends QueryHandler<
  GetFavorisJeuneQuery,
  FavorisQueryModel[]
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetFavorisJeuneQueryHandler')
  }

  async authorize(
    query: GetFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMiloAvecPartageFavoris(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async handle(query: GetFavorisJeuneQuery): Promise<FavorisQueryModel[]> {
    const dateDebut = query.dateDebut?.toJSDate()
    const dateFin = query.dateFin?.toJSDate()

    let dateCompare
    if (dateDebut && dateFin)
      dateCompare = { [Op.between]: [dateDebut, dateFin] }
    else if (dateDebut) dateCompare = { [Op.gte]: dateDebut }
    else if (dateFin) dateCompare = { [Op.lte]: dateFin }

    let where: WhereOptions = { idJeune: query.idJeune }
    if (dateCompare) {
      where = {
        ...where,
        [Op.or]: [
          { dateCandidature: dateCompare },
          { [Op.and]: { dateCandidature: null, dateCreation: dateCompare } }
        ]
      }
    }

    const [
      listeFavorisOffresEmploi,
      listeFavorisOffresImmersion,
      listeFavorisOffresServiceCivique
    ] = await Promise.all([
      FavoriOffreEmploiSqlModel.findAll({ where }),
      FavoriOffreImmersionSqlModel.findAll({ where }),
      FavoriOffreEngagementSqlModel.findAll({ where })
    ])

    return listeFavorisOffresEmploi
      .map(fromOffreEmploiSqlToFavorisQueryModel)
      .concat(
        listeFavorisOffresImmersion.map(
          fromOffreImmersionSqlToFavorisQueryModel
        )
      )
      .concat(
        listeFavorisOffresServiceCivique.map(
          fromOffreServiceCiviqueSqlToFavorisQueryModel
        )
      )
      .sort(compareDateCreationAntechronologique)
  }

  async monitor(): Promise<void> {
    return
  }
}
