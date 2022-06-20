import { Injectable } from '@nestjs/common'
import { OffresImmersion } from '../../../domain/offre-immersion'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { OffreImmersionQueryModel } from '../query-models/offres-immersion.query-model'
import { URLSearchParams } from 'url'
import { PartenaireImmersion } from '../../../infrastructure/repositories/dto/immersion.dto'
import { toOffreImmersionQueryModel } from '../../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { RechercheOffreInvalide } from '../../../building-blocks/types/domain-error'
import { ImmersionClient } from '../../../infrastructure/clients/immersion-client'

@Injectable()
export class FindAllOffresImmersionQueryGetter {
  constructor(private immersionClient: ImmersionClient) {}

  async handle(
    criteres: OffresImmersion.Criteres
  ): Promise<Result<OffreImmersionQueryModel[]>> {
    const params = new URLSearchParams()
    params.append('rome', criteres.rome)
    params.append('longitude', criteres.lon.toString())
    params.append('latitude', criteres.lat.toString())
    params.append('distance_km', criteres.distance.toString())
    params.append('sortedBy', 'date')

    try {
      const response = await this.immersionClient.get<
        PartenaireImmersion.DtoV1[]
      >('v1/immersion-offers', params)

      return success(response.data.map(toOffreImmersionQueryModel))
    } catch (e) {
      if (e.response?.status === 400) {
        const message = e.response.data.errors
          .map((error: { message: string }) => error.message)
          .join(' - ')
        return failure(new RechercheOffreInvalide(message))
      }
      throw e
    }
  }
}
