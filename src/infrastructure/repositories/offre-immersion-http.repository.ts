import { Injectable } from '@nestjs/common'
import { OffreImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-models'
import { OffresImmersion } from '../../domain/offre-immersion'
import { ImmersionClient } from '../clients/immersion-client'

@Injectable()
export class OffresImmersionHttpRepository
  implements OffresImmersion.Repository
{
  constructor(private immpersionClient: ImmersionClient) {}

  async findAll(
    rome: string,
    lat: number,
    lon: number
  ): Promise<OffreImmersionQueryModel[]> {
    const payload = {
      rome,
      location: { lat, lon },
      distance_km: 10
    }

    const response = await this.immpersionClient.post(
      'search-immersion',
      payload
    )

    return response.data.map(toOffreImmersionQueryModel)
  }
}

interface OffreImmpersionDto {
  id: string
  rome: string
  romeLabel: string
  naf: string
  nafLabel: string
  siret: string
  name: string
  voluntaryToImmersion: boolean
  location: { lat: number; lon: number }
  address: string
  city: string
  distance_m?: number
  contactId?: string
  contactMode?: 'UNKNOWN' | 'EMAIL' | 'PHONE' | 'IN_PERSON' | undefined
  contactDetails:
    | {
        id: string
        lastName: string
        firstName: string
        role: string
        email?: string
        phone?: string
      }
    | undefined
}

function toOffreImmersionQueryModel(
  offresImmersionDto: OffreImmpersionDto
): OffreImmersionQueryModel {
  return {
    id: offresImmersionDto.id,
    metier: offresImmersionDto.romeLabel,
    nomEtablissement: offresImmersionDto.name,
    secteurActivite: offresImmersionDto.nafLabel,
    ville: offresImmersionDto.city
  }
}
