import { Injectable } from '@nestjs/common'
import { Recherche } from '../../domain/recherche'
import { RechercheSqlModel } from '../sequelize/models/recherche.sql-model'
import { fromSqlToRechercheQueryModel } from './mappers/recherches.mappers'
import { RechercheQueryModel } from '../../application/queries/query-models/recherches.query-model'

@Injectable()
export class RechercheSqlRepository implements Recherche.Repository {
  async saveRecherche(idJeune: string, recherche: Recherche): Promise<void> {
    await RechercheSqlModel.create({
      id: recherche.id,
      idJeune: idJeune,
      titre: recherche.titre,
      metier: recherche.metier,
      type: recherche.type,
      localisation: recherche.localisation,
      criteres: recherche.criteres
    })
  }

  async getRecherches(idJeune: string): Promise<RechercheQueryModel[]> {
    const recherchesSql = await RechercheSqlModel.findAll({
      where: {
        idJeune
      }
    })
    return recherchesSql.map(fromSqlToRechercheQueryModel)
  }

  async getRecherche(
    idRecherche: string,
    idJeune: string
  ): Promise<RechercheQueryModel | undefined> {
    const result = await RechercheSqlModel.findOne({
      where: {
        id: idRecherche,
        idJeune: idJeune
      }
    })
    if (!result) {
      return undefined
    }

    return fromSqlToRechercheQueryModel(result)
  }

  async deleteRecherche(idRecherche: string, idJeune: string): Promise<void> {
    await RechercheSqlModel.destroy({
      where: {
        id: idRecherche,
        idJeune: idJeune
      }
    })
  }
}
