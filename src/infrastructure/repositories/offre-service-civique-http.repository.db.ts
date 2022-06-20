import { Injectable, Logger } from '@nestjs/common'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { OffreServiceCivique } from '../../domain/offre-service-civique'
import { EngagementClient } from '../clients/engagement-client'
import { FavoriOffreEngagementSqlModel } from '../sequelize/models/favori-offre-engagement.sql-model'
import {
  fromSqlToIds,
  fromSqlToOffreServiceCivique,
  toOffreEngagement
} from './mappers/service-civique.mapper'

@Injectable()
export class OffreServiceCiviqueHttpSqlRepository
  implements OffreServiceCivique.Repository
{
  private logger: Logger

  constructor(private engagementClient: EngagementClient) {
    this.logger = new Logger('OffreServiceCiviqueHttpSqlRepository')
  }

  async getServiceCiviqueById(
    idOffreEngagement: string
  ): Promise<Result<OffreServiceCivique>> {
    try {
      const response =
        await this.engagementClient.get<DetailOffreEngagementDto>(
          `v0/mission/${idOffreEngagement}`
        )
      return success(toOffreEngagement(response.data.data))
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

  async getFavorisIdsByJeune(idJeune: string): Promise<Core.Id[]> {
    const favorisIdsSql = await FavoriOffreEngagementSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      }
    })

    return fromSqlToIds(favorisIdsSql)
  }

  async getFavorisByJeune(idJeune: string): Promise<OffreServiceCivique[]> {
    const favorisSql = await FavoriOffreEngagementSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(fromSqlToOffreServiceCivique)
  }

  async getFavori(
    idJeune: string,
    idOffre: string
  ): Promise<OffreServiceCivique | undefined> {
    const result = await FavoriOffreEngagementSqlModel.findOne({
      where: {
        idJeune,
        idOffre
      }
    })

    if (!result) {
      return undefined
    }

    return fromSqlToOffreServiceCivique(result)
  }

  async saveAsFavori(
    idJeune: string,
    offre: OffreServiceCivique
  ): Promise<void> {
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
  title: string
  domain: string
  publisherId?: string
  publisherName?: string
  publisherUrl?: string
  publisherLogo?: string
  lastSyncAt?: string
  applicationUrl?: string
  statusCode?: string
  statusComment?: string
  clientId?: string
  description?: string
  organizationName?: string
  organizationUrl?: string
  organizationFullAddress?: string
  organizationCity?: string
  organizationPostCode?: string
  organizationDescription?: string
  startAt?: string
  endAt?: string
  postedAt?: string
  priority?: string
  metadata?: string
  adresse?: string
  postalCode?: string
  departmentName?: string
  departmentCode?: string
  city?: string
  region?: string
  country?: string
  domainLogo?: string
  activity?: string
  location?: {
    lon: number
    lat: number
  }
  remote?: string
  deleted?: string
  createdAt?: string
  updatedAt?: string
}
