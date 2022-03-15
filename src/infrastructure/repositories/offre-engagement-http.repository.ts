import { Injectable, Logger } from '@nestjs/common'
import { URLSearchParams } from 'url'
import {
  DetailOffreEngagementQueryModel,
  OffreEngagementQueryModel
} from '../../application/queries/query-models/service-civique.query-models'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { OffreEngagement } from '../../domain/offre-engagement'
import { EngagementClient } from '../clients/engagement-client'
import { FavoriOffreEngagementSqlModel } from '../sequelize/models/favori-offre-engagement.sql-model'
import {
  fromSqlToIds,
  fromSqlToOffreEngagement,
  toDetailOffreEngagementQueryModel,
  toServiceCiviqueQueryModel
} from './mappers/service-civique.mapper'

@Injectable()
export class EngagementHttpSqlRepository implements OffreEngagement.Repository {
  private logger: Logger

  constructor(private engagementClient: EngagementClient) {
    this.logger = new Logger('EngagementHttpSqlRepository')
  }

  async findAll(
    criteres: OffreEngagement.Criteres
  ): Promise<Result<OffreEngagementQueryModel[]>> {
    try {
      const params = this.construireLesParams(criteres)
      const response = await this.engagementClient.get<EngagementDto>(
        'v0/mission/search',
        params
      )
      return success(toServiceCiviqueQueryModel(response.data))
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status < 500) {
        const erreur = new ErreurHttp(
          e.response.data?.message,
          e.response.status
        )
        return failure(erreur)
      }
      return failure(e)
    }
  }

  async getOffreEngagementQueryModelById(
    idOffreEngagement: string
  ): Promise<Result<DetailOffreEngagementQueryModel>> {
    try {
      const response =
        await this.engagementClient.get<DetailOffreEngagementDto>(
          `v0/mission/${idOffreEngagement}`
        )
      return success(toDetailOffreEngagementQueryModel(response.data.data))
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status < 500) {
        if (e.response?.status == 404) {
          const erreur = new NonTrouveError(
            'OffreEngagement',
            idOffreEngagement
          )
          return failure(erreur)
        } else {
          const erreur = new ErreurHttp(
            e.response.data?.message,
            e.response.status
          )
          return failure(erreur)
        }
      }
      return failure(e)
    }
  }

  private construireLesParams(
    criteres: OffreEngagement.Criteres
  ): URLSearchParams {
    const {
      page,
      limit,
      lat,
      lon,
      dateDeDebutMaximum,
      dateDeDebutMinimum,
      distance,
      domaine,
      editeur
    } = criteres
    const params = new URLSearchParams()
    params.append('size', limit.toString())
    params.append('from', (page * limit - limit).toString())

    if (lat) {
      params.append('lat', lat.toString())
    }
    if (lon) {
      params.append('lon', lon.toString())
    }
    if (dateDeDebutMaximum) {
      params.append('startAt', `lt:${dateDeDebutMaximum.toUTC().toISO()}`)
    }
    if (dateDeDebutMinimum) {
      params.append('startAt', `gt:${dateDeDebutMinimum.toUTC().toISO()}`)
    }
    if (distance) {
      params.append('distance', `${distance}km`)
    }
    if (domaine) {
      params.append('domain', domaine)
    }

    params.append('publisher', editeur)
    params.append('sortBy', 'createdAt')
    return params
  }

  async getFavorisIdsQueryModelsByJeune(idJeune: string): Promise<Core.Id[]> {
    const favorisIdsSql = await FavoriOffreEngagementSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      }
    })

    return fromSqlToIds(favorisIdsSql)
  }

  async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<OffreEngagementQueryModel[]> {
    const favorisSql = await FavoriOffreEngagementSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(fromSqlToOffreEngagement)
  }

  async getFavori(
    idJeune: string,
    idOffre: string
  ): Promise<OffreEngagement | undefined> {
    const result = await FavoriOffreEngagementSqlModel.findOne({
      where: {
        idJeune,
        idOffre
      }
    })

    if (!result) {
      return undefined
    }

    return fromSqlToOffreEngagement(result)
  }

  async saveAsFavori(idJeune: string, offre: OffreEngagement): Promise<void> {
    await FavoriOffreEngagementSqlModel.create({
      idOffre: offre.id,
      idJeune,
      domaine: offre.domaine,
      titre: offre.titre,
      ville: offre.ville,
      organisation: offre.organisation,
      dateDeDebut: offre.dateDeDebut
    })
  }

  async deleteFavori(idJeune: string, idOffre: string): Promise<void> {
    await FavoriOffreEngagementSqlModel.destroy({
      where: {
        idOffre,
        idJeune
      }
    })
  }
}

export interface EngagementDto {
  total: number
  hits: OffreEngagementDto[]
  facets: {
    departmentName: Array<{
      key: string
      doc_count: number
    }>
    activities: Array<{
      key: string
      doc_count: number
    }>
    domains: Array<{
      key: string
      doc_count: number
    }>
  }
}

export interface DetailOffreEngagementDto {
  ok: boolean
  data: OffreEngagementDto
}

export interface OffreEngagementDto {
  id: string
  publisherId: string
  publisherName: string
  publisherUrl: string
  publisherLogo: string
  lastSyncAt: string
  applicationUrl: string
  statusCode: string
  statusComment: string
  clientId: string
  title: string
  description: string
  organizationName: string
  organizationUrl: string
  organizationFullAddress: string
  organizationCity: string
  organizationPostCode: string
  organizationDescription: string
  startAt: string
  endAt: string
  postedAt: string
  priority: string
  metadata: string
  adresse: string
  postalCode: string
  departmentName: string
  departmentCode: string
  city: string
  region: string
  country: string
  domain: string
  domainLogo: string
  activity: string
  location: {
    lon: number
    lat: number
  }
  remote: string
  deleted: string
  createdAt: string
  updatedAt: string
}
