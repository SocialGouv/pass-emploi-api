import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { RechercheQueryModel } from '../../application/queries/query-models/recherches.query-model'
import { Recherche } from '../../domain/recherche'
import { RechercheSqlModel } from '../sequelize/models/recherche.sql-model'
import { fromSqlToRechercheQueryModel } from './mappers/recherches.mappers'
import { DateTime } from 'luxon'

@Injectable()
export class RechercheSqlRepository implements Recherche.Repository {
  async saveRecherche(recherche: Recherche): Promise<void> {
    await RechercheSqlModel.upsert({
      id: recherche.id,
      idJeune: recherche.idJeune,
      titre: recherche.titre,
      metier: recherche.metier,
      type: recherche.type,
      localisation: recherche.localisation,
      criteres: recherche.criteres,
      dateCreation: recherche.dateCreation,
      dateDerniereRecherche: recherche.dateDerniereRecherche,
      etatDerniereRecherche: recherche.etat
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

  async findAvantDate(
    typeRecherches: Recherche.Type[],
    nombreRecherches: number,
    date: DateTime
  ): Promise<Recherche[]> {
    const dateAMinuit = date.set({ hour: 0, minute: 0, second: 0 }).toJSDate()
    const recherchesSql = await RechercheSqlModel.findAll({
      where: {
        type: {
          [Op.in]: typeRecherches
        },
        dateDerniereRecherche: {
          [Op.lt]: dateAMinuit
        }
      },
      limit: nombreRecherches
    })

    return recherchesSql.map(rechercheSql => {
      return {
        id: rechercheSql.id,
        type: rechercheSql.type,
        titre: rechercheSql.titre,
        metier: rechercheSql.metier ?? undefined,
        localisation: rechercheSql.localisation ?? undefined,
        criteres: rechercheSql.criteres ?? undefined,
        idJeune: rechercheSql.idJeune,
        dateCreation: DateTime.fromJSDate(rechercheSql.dateCreation),
        dateDerniereRecherche: DateTime.fromJSDate(
          rechercheSql.dateDerniereRecherche
        ),
        etat: rechercheSql.etatDerniereRecherche
      }
    })
  }

  async getRecherche(
    idRecherche: string
  ): Promise<RechercheQueryModel | undefined> {
    const result = await RechercheSqlModel.findOne({
      where: {
        id: idRecherche
      }
    })
    if (!result) {
      return undefined
    }

    return fromSqlToRechercheQueryModel(result)
  }

  async deleteRecherche(idRecherche: string): Promise<void> {
    await RechercheSqlModel.destroy({
      where: {
        id: idRecherche
      }
    })
  }

  async existe(idRecherche: string, idJeune: string): Promise<boolean> {
    const rechercheSqlModel = await RechercheSqlModel.findOne({
      where: { id: idRecherche, idJeune: idJeune }
    })
    return !!rechercheSqlModel
  }
}
