import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { RechercheQueryModel } from '../../application/queries/query-models/recherches.query-model'
import { OffresEmploi } from '../../domain/offre-emploi'
import { OffresImmersion } from '../../domain/offre-immersion'
import { Recherche } from '../../domain/recherche'
import { RechercheSqlModel } from '../sequelize/models/recherche.sql-model'
import { fromSqlToRechercheQueryModel } from './mappers/recherches.mappers'
import { DateTime } from 'luxon'
import { GetOffresEmploiQuery } from '../../application/queries/get-offres-emploi.query.handler'
import { CommuneSqlModel } from '../sequelize/models/commune.sql-model'
import { SequelizeInjectionToken } from '../sequelize/providers'
import { GetOffresImmersionQuery } from '../../application/queries/get-offres-immersion.query.handler'
import { FindOptions } from 'sequelize/dist/lib/model'

@Injectable()
export class RechercheSqlRepository implements Recherche.Repository {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

  async createRecherche(recherche: Recherche): Promise<void> {
    await RechercheSqlModel.create({
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

    switch (recherche.type) {
      case Recherche.Type.OFFRES_EMPLOI:
      case Recherche.Type.OFFRES_ALTERNANCE:
        if ((recherche.criteres as GetOffresEmploiQuery).commune) {
          const commune = await CommuneSqlModel.findOne({
            where: {
              code: (recherche.criteres as GetOffresEmploiQuery).commune
            }
          })

          if (commune) {
            const center = {
              type: 'Point',
              coordinates: [commune.longitude, commune.latitude]
            }
            const distance =
              (recherche.criteres as GetOffresEmploiQuery).rayon ??
              OffresEmploi.DISTANCE_PAR_DEFAUT
            await this.sequelize.query(
              `UPDATE recherche
             SET geometrie = (
                 ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(
                   center
                 )}')::geography, 4326), ${distance * 1000})::geometry)
            WHERE id='${recherche.id}'
              `
            )
          }
        }
        break
      case Recherche.Type.OFFRES_IMMERSION:
        const criteres = recherche.criteres as GetOffresImmersionQuery
        if (criteres.lon && criteres.lat) {
          const center = {
            type: 'Point',
            coordinates: [criteres.lon, criteres.lat]
          }
          const distance =
            criteres.distance ?? OffresImmersion.DISTANCE_PAR_DEFAUT
          await this.sequelize.query(
            `UPDATE recherche
             SET geometrie = (
                 ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(
                   center
                 )}')::geography, 4326), ${distance * 1000})::geometry)
            WHERE id='${recherche.id}'
              `
          )
        }
    }
  }

  async updateRecherche(recherche: Recherche): Promise<void> {
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

  async getRecherches(
    idJeune: string,
    avecGeometrie?: boolean
  ): Promise<RechercheQueryModel[]> {
    const options: FindOptions = {
      where: {
        idJeune
      }
    }

    if (!avecGeometrie) {
      options.attributes = {
        exclude: ['geometrie']
      }
    }

    const recherchesSql = await RechercheSqlModel.findAll(options)
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
