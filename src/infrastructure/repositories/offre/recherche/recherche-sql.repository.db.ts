import { Inject, Injectable } from '@nestjs/common'
import { Op, QueryTypes, Sequelize, WhereOptions } from 'sequelize'
import { Recherche } from '../../../../domain/offre/recherche/recherche'
import { RechercheSqlModel } from '../../../sequelize/models/recherche.sql-model'
import { fromSqlToRecherche } from '../../mappers/recherches.mappers'
import { DateTime } from 'luxon'
import { GetOffresEmploiQuery } from '../../../../application/queries/get-offres-emploi.query.handler'
import { CommuneSqlModel } from '../../../sequelize/models/commune.sql-model'
import { SequelizeInjectionToken } from '../../../sequelize/providers'
import { GetOffresImmersionQuery } from '../../../../application/queries/get-offres-immersion.query.handler'
import { GetServicesCiviqueQuery } from '../../../../application/queries/get-offres-services-civique.query.handler'
import { Offre } from '../../../../domain/offre/offre'

@Injectable()
export class RechercheSqlRepository implements Recherche.Repository {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

  async get(id: string): Promise<Recherche | undefined> {
    const rechercheSql = await RechercheSqlModel.findByPk(id)
    if (!rechercheSql) {
      return undefined
    }
    return fromSqlToRecherche(rechercheSql)
  }

  async save(recherche: Recherche): Promise<void> {
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

    let criteres
    let distance
    let longitude
    let latitude
    switch (recherche.type) {
      case Recherche.Type.OFFRES_EMPLOI:
      case Recherche.Type.OFFRES_ALTERNANCE:
        criteres = recherche.criteres as GetOffresEmploiQuery

        if (criteres.commune) {
          const commune = await CommuneSqlModel.findOne({
            where: {
              code: criteres.commune
            }
          })
          distance = criteres.rayon ?? Offre.Recherche.DISTANCE_PAR_DEFAUT
          longitude = Number(commune?.longitude)
          latitude = Number(commune?.latitude)
        }
        break
      case Recherche.Type.OFFRES_IMMERSION:
        criteres = recherche.criteres as GetOffresImmersionQuery
        distance = criteres.distance ?? Offre.Recherche.DISTANCE_PAR_DEFAUT
        longitude = criteres.lon
        latitude = criteres.lat
        break
      case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
        criteres = recherche.criteres as GetServicesCiviqueQuery
        distance = criteres.distance ?? Offre.Recherche.DISTANCE_PAR_DEFAUT
        longitude = criteres.lon
        latitude = criteres.lat
    }
    if (distance !== undefined) {
      await this.createGeometrie(recherche.id, distance, longitude, latitude)
    }
  }

  async update(recherche: Recherche): Promise<void> {
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

  async delete(idRecherche: string): Promise<void> {
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

  async trouverLesRecherchesImmersions(
    criteres: GetOffresImmersionQuery,
    limit: number,
    offset: number
  ): Promise<Recherche[]> {
    const point = {
      type: 'Point',
      coordinates: [criteres.lon, criteres.lat]
    }

    const rechercheSqlModels = await RechercheSqlModel.findAll({
      attributes: {
        exclude: ['geometrie']
      },
      order: [['date_creation', 'ASC']],
      limit,
      offset,
      where: {
        [Op.and]: [
          { type: Recherche.Type.OFFRES_IMMERSION },
          {
            criteres: {
              rome: {
                [Op.eq]: criteres.rome
              }
            }
          },
          Sequelize.literal(`ST_CONTAINS(geometrie, ST_SetSRID(
        st_geomfromgeojson('${JSON.stringify(point)}'),${
            Recherche.Geometrie.PROJECTION_WGS84
          })::geometry)`)
        ]
      }
    })

    return rechercheSqlModels.map(rechercheSql => ({
      id: rechercheSql.id,
      idJeune: rechercheSql.idJeune,
      type: rechercheSql.type,
      titre: rechercheSql.titre,
      metier: rechercheSql.metier ?? undefined,
      localisation: rechercheSql.localisation ?? undefined,
      criteres: rechercheSql.criteres as GetOffresImmersionQuery,
      etat: rechercheSql.etatDerniereRecherche,
      dateDerniereRecherche: DateTime.fromJSDate(
        rechercheSql.dateDerniereRecherche
      ),
      dateCreation: DateTime.fromJSDate(rechercheSql.dateCreation)
    }))
  }

  private async createGeometrie(
    idRecherche: string,
    distance: number,
    longitude?: number,
    latitude?: number
  ): Promise<void> {
    if (longitude && latitude) {
      const center = {
        type: 'Point',
        coordinates: [longitude, latitude]
      }

      await this.sequelize.query(
        `UPDATE recherche
         SET geometrie = (
             ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON(:center)::geography, ${Recherche.Geometrie.PROJECTION_WGS84}), :distance)::geometry)
        WHERE id = :id_recherche`,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            center: JSON.stringify(center),
            distance: distance * 1000,
            id_recherche: idRecherche
          }
        }
      )
    }
  }

  async trouverLesRecherchesServicesCiviques(
    query: GetServicesCiviqueQuery,
    limit: number,
    offset: number,
    dateDerniereRecherche: DateTime
  ): Promise<Recherche[]> {
    const filtres: WhereOptions[] = [
      { type: Recherche.Type.OFFRES_SERVICES_CIVIQUE }
    ]
    filtres.push(
      this.construireLeFiltreDomaine(query),
      this.construireLeFiltreDateDeDebut(query),
      this.construireLeFiltreDepuisLaDerniereRecherche(dateDerniereRecherche),
      this.construireLeFiltreLocalisation(query)
    )

    const rechercheSqlModels = await RechercheSqlModel.findAll({
      attributes: {
        exclude: ['geometrie']
      },
      order: [['date_creation', 'ASC']],
      limit,
      offset,
      where: {
        [Op.and]: filtres
      }
    })
    return rechercheSqlModels.map(fromSqlToRecherche)
  }

  private construireLeFiltreLocalisation(
    query: Offre.Recherche.ServiceCivique
  ): WhereOptions {
    if (query.lat && query.lon) {
      const point = {
        type: 'Point',
        coordinates: [query.lon, query.lat]
      }
      return {
        [Op.or]: [
          Sequelize.literal(`ST_CONTAINS(geometrie, ST_SetSRID(
  st_geomfromgeojson('${JSON.stringify(point)}'),${
            Recherche.Geometrie.PROJECTION_WGS84
          })::geometry)`),
          {
            geometrie: {
              [Op.eq]: null
            }
          }
        ]
      }
    } else {
      return { geometrie: { [Op.eq]: null } }
    }
  }

  private construireLeFiltreDateDeDebut(
    query: Offre.Recherche.ServiceCivique
  ): WhereOptions {
    if (query.dateDeDebutMinimum) {
      return {
        criteres: {
          dateDeDebutMinimum: {
            [Op.or]: [{ [Op.eq]: null }, { [Op.lte]: query.dateDeDebutMinimum }]
          }
        }
      }
    } else {
      return {
        criteres: {
          dateDeDebutMinimum: {
            [Op.eq]: null
          }
        }
      }
    }
  }

  private construireLeFiltreDepuisLaDerniereRecherche(
    depuis: DateTime
  ): WhereOptions {
    return {
      dateDerniereRecherche: {
        [Op.lt]: depuis.toJSDate()
      }
    }
  }

  private construireLeFiltreDomaine(
    query: GetServicesCiviqueQuery
  ): WhereOptions {
    if (query.domaine) {
      return {
        criteres: {
          domaine: {
            [Op.or]: [{ [Op.eq]: null }, { [Op.eq]: query.domaine }]
          }
        }
      }
    } else {
      return {
        criteres: {
          domaine: {
            [Op.eq]: null
          }
        }
      }
    }
  }
}
