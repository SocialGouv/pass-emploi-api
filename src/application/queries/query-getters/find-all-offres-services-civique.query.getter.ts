import { Injectable, Logger } from '@nestjs/common'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { URLSearchParams } from 'url'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { OffreServiceCivique } from '../../../domain/offre-service-civique'
import { toOffresServicesCivique } from '../../../infrastructure/repositories/mappers/service-civique.mapper'
import { EngagementDto } from '../../../infrastructure/repositories/offre-service-civique-http.repository.db'
import { EngagementClient } from '../../../infrastructure/clients/engagement-client'

@Injectable()
export class FindAllOffresServicesCiviqueQueryGetter {
  private logger: Logger

  constructor(private engagementClient: EngagementClient) {
    this.logger = new Logger('FindAllOffresServicesCiviqueQueryGetter')
  }

  async handle(
    criteres: OffreServiceCivique.Criteres
  ): Promise<Result<OffreServiceCivique[]>> {
    try {
      const params = this.construireLesParams(criteres)
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
    criteres: OffreServiceCivique.Criteres
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
      editeur,
      dateDeCreationMinimum
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
    if (dateDeCreationMinimum) {
      params.append('createdAt', `gt:${dateDeCreationMinimum.toUTC().toISO()}`)
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
}
