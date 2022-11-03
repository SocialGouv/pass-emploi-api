import { Injectable, Logger } from '@nestjs/common'
import { URLSearchParams } from 'url'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Offre } from '../../../domain/offre/offre'
import { EngagementClient } from '../../../infrastructure/clients/engagement-client'
import { toOffresServicesCivique } from '../../../infrastructure/repositories/mappers/service-civique.mapper'
import { EngagementDto } from '../../../infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { GetServicesCiviqueQuery } from '../get-services-civique.query.handler'

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
  ): Promise<
    Result<{ total: number; results: Offre.Favori.ServiceCivique[] }>
  > {
    try {
      const params = this.construireLesParams(query)
      const response = await this.engagementClient.get<EngagementDto>(
        'v0/mission/search',
        params
      )
      return success(toOffresServicesCivique(response.data))
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

  private construireLesParams(
    criteres: GetServicesCiviqueQuery
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
      dateDeCreationMinimum
    } = criteres
    const limiteAvecDefault = limit || DEFAULT_LIMIT
    const pageAvecDefault = page || DEFAULT_PAGE

    const params = new URLSearchParams()
    params.append('size', limiteAvecDefault.toString())
    params.append(
      'from',
      (pageAvecDefault * limiteAvecDefault - limiteAvecDefault).toString()
    )

    if (lat) {
      params.append('lat', lat.toString())
    }
    if (lon) {
      params.append('lon', lon.toString())
    }
    if (dateDeDebutMaximum) {
      params.append('startAt', `lt:${dateDeDebutMaximum}`)
    }
    if (dateDeDebutMinimum) {
      params.append('startAt', `gt:${dateDeDebutMinimum}`)
    }
    if (dateDeCreationMinimum) {
      params.append('createdAt', `gt:${dateDeCreationMinimum}`)
    }
    if (distance) {
      params.append('distance', `${distance}km`)
    }
    if (domaine) {
      params.append('domain', domaine)
    }

    params.append('publisher', Offre.ServiceCivique.Editeur.SERVICE_CIVIQUE)
    params.append('sortBy', 'createdAt')
    return params
  }
}
