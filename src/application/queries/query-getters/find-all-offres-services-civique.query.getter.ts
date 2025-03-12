import { Injectable, Logger } from '@nestjs/common'
import { ServiceCiviqueQueryModel } from 'src/application/queries/query-models/service-civique.query-model'
import { URLSearchParams } from 'url'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Offre } from '../../../domain/offre/offre'
import { EngagementClient } from '../../../infrastructure/clients/engagement-client'
import {
  EngagementDto,
  OffreEngagementDto
} from '../../../infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { GetServicesCiviqueQuery } from '../get-offres-services-civique.query.handler'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

@Injectable()
export class FindAllOffresServicesCiviqueQueryGetter {
  private logger: Logger

  constructor(private engagementClient: EngagementClient) {
    this.logger = new Logger('FindAllOffresServicesCiviqueQueryGetter')
  }

  async handle(
    query: GetServicesCiviqueQuery
  ): Promise<Result<{ total: number; results: ServiceCiviqueQueryModel[] }>> {
    try {
      const params = construireLesParams(query)
      const response = await this.engagementClient.get<EngagementDto>(
        'v0/mission/search',
        params
      )

      const queryModels = response.data.hits
        .filter(({ deleted }) => !deleted)
        .map(dtoToServiceCiviqueQueryModel)
      return success({ total: queryModels.length, results: queryModels })
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
}

function construireLesParams(
  criteres: GetServicesCiviqueQuery
): URLSearchParams {
  const limiteAvecDefault = criteres.limit || DEFAULT_LIMIT
  const pageAvecDefault = criteres.page || DEFAULT_PAGE

  const params = new URLSearchParams()
  params.append('size', limiteAvecDefault.toString())
  params.append(
    'from',
    (pageAvecDefault * limiteAvecDefault - limiteAvecDefault).toString()
  )

  if (criteres.lat) {
    params.append('lat', criteres.lat.toString())
  }
  if (criteres.lon) {
    params.append('lon', criteres.lon.toString())
  }
  if (criteres.dateDeDebutMaximum) {
    params.append('startAt', `lt:${criteres.dateDeDebutMaximum}`)
  }
  if (criteres.dateDeDebutMinimum) {
    params.append('startAt', `gt:${criteres.dateDeDebutMinimum}`)
  }
  if (criteres.dateDeCreationMinimum) {
    params.append('createdAt', `gt:${criteres.dateDeCreationMinimum}`)
  }
  if (criteres.distance) {
    params.append('distance', `${criteres.distance}km`)
  }
  if (criteres.domaine) {
    params.append('domain', criteres.domaine)
  }

  params.append('publisher', Offre.ServiceCivique.Editeur.SERVICE_CIVIQUE)
  params.append('sortBy', 'createdAt')
  return params
}

function dtoToServiceCiviqueQueryModel(
  dto: OffreEngagementDto
): ServiceCiviqueQueryModel {
  return {
    id: dto._id,
    titre: dto.title,
    dateDeDebut: dto.startAt,
    domaine: dto.domain,
    ville: dto.city,
    organisation: dto.organizationName,
    localisation: dto.location && {
      latitude: dto.location.lat,
      longitude: dto.location.lon
    }
  }
}
