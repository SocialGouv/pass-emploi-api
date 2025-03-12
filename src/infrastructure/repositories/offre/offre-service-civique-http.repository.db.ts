import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Offre } from '../../../domain/offre/offre'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import { sqlToOffreServiceCivique } from '../mappers/service-civique.mapper'

@Injectable()
export class OffreServiceCiviqueHttpSqlRepository
  implements Offre.Favori.ServiceCivique.Repository
{
  async get(
    idJeune: string,
    idOffre: string
  ): Promise<Offre.Favori<Offre.Favori.ServiceCivique> | undefined> {
    const sqlModel = await FavoriOffreEngagementSqlModel.findOne({
      where: {
        idJeune,
        idOffre
      }
    })
    if (!sqlModel) {
      return undefined
    }

    const favori: Offre.Favori<Offre.Favori.ServiceCivique> = {
      idBeneficiaire: idJeune,
      dateCreation: DateTime.fromJSDate(sqlModel.dateCreation),
      offre: sqlToOffreServiceCivique(sqlModel)
    }
    if (sqlModel.dateCandidature) {
      favori.dateCandidature = DateTime.fromJSDate(sqlModel.dateCandidature)
    }
    return favori
  }

  async save(favori: Offre.Favori<Offre.Favori.ServiceCivique>): Promise<void> {
    const { idBeneficiaire, offre, dateCreation, dateCandidature } = favori

    await FavoriOffreEngagementSqlModel.upsert({
      idOffre: offre.id,
      idJeune: idBeneficiaire,
      domaine: offre.domaine,
      titre: offre.titre,
      ville: offre.ville,
      organisation: offre.organisation,
      dateDeDebut: offre.dateDeDebut,
      dateCreation: dateCreation.toJSDate(),
      dateCandidature: dateCandidature?.toJSDate()
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
