import { Injectable } from '@nestjs/common'
import { OffresImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-models'
import { OffresImmersion } from '../../domain/offre-immersion'
import { PoleEmploiClient } from '../clients/pole-emploi-client'

@Injectable()
export class OffresImmersionHttpSqlRepository
  implements OffresImmersion.Repository
{
  constructor(private poleEmploiClient: PoleEmploiClient) {}

  async findAll(
    metier?: string,
    ville?: string
  ): Promise<OffresImmersionQueryModel> {
    const params = new URLSearchParams()

    if (metier) {
      params.append('motsCles', metier)
    }
    if (ville) {
      params.append('departement', ville)
    }
    const response = await this.poleEmploiClient.get(
      'offresdemploi/v2/offres/search',
      params
    )
    return response.data
  }
}

export interface OffreEmploiDto {
  id: string
  intitule: string
  typeContrat: string
  dureeTravailLibelleConverti: string
  entreprise?: {
    nom: string
  }
  lieuTravail?: {
    libelle: string
    codePostal: string
    commune: string
  }
  contact: {
    urlPostulation: string
  }
  origineOffre: {
    urlOrigine: string
  }
  alternance?: boolean
}

export interface OffresImmersionDto {
  resultats: OffreEmploiDto[]
}
