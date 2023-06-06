import { Injectable } from '@nestjs/common'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { OffreImmersionQueryModel } from '../query-models/offres-immersion.query-model'
import { URLSearchParams } from 'url'
import { PartenaireImmersion } from '../../../infrastructure/repositories/dto/immersion.dto'
import { toOffreImmersionQueryModel } from '../../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { RechercheOffreInvalide } from '../../../building-blocks/types/domain-error'
import { ImmersionClient } from '../../../infrastructure/clients/immersion-client'
import { GetOffresImmersionQuery } from '../get-offres-immersion.query.handler'
import { Offre } from '../../../domain/offre/offre'

@Injectable()
export class FindAllOffresImmersionQueryGetter {
  constructor(private immersionClient: ImmersionClient) {}

  async handle(
    query: GetOffresImmersionQuery
  ): Promise<Result<OffreImmersionQueryModel[]>> {
    const distanceAvecDefault = query.distance
      ? query.distance.toString()
      : Offre.Recherche.DISTANCE_PAR_DEFAUT.toString()
    const params = new URLSearchParams()
    params.append('rome', query.rome)
    params.append('longitude', query.lon.toString())
    params.append('latitude', query.lat.toString())
    params.append('distance_km', distanceAvecDefault)
    params.append('sortedBy', 'date')
    params.append('voluntaryToImmersion', 'true')

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
