import { Injectable } from '@nestjs/common'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import { fromSqlToOffreServiceCivique } from '../mappers/service-civique.mapper'
import { Offre } from '../../../domain/offre/offre'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class OffreServiceCiviqueHttpSqlRepository
  implements Offre.Favori.ServiceCivique.Repository
{
  constructor(private readonly dateService: DateService) {}

  async get(
    idJeune: string,
    idOffre: string
  ): Promise<Offre.Favori.ServiceCivique | undefined> {
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

  async save(
    idJeune: string,
    offre: Offre.Favori.ServiceCivique
  ): Promise<void> {
    await FavoriOffreEngagementSqlModel.create({
      idOffre: offre.id,
      idJeune,
      domaine: offre.domaine,
      titre: offre.titre,
      ville: offre.ville,
      organisation: offre.organisation,
      dateDeDebut: offre.dateDeDebut,
      dateCreation: this.dateService.nowJs()
    })
  }

  async delete(idJeune: string, idOffre: string): Promise<void> {
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
  _id: string
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
  address?: string
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
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}
