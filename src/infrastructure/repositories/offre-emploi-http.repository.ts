import { Injectable } from '@nestjs/common'
import {
  OffresEmploi,
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from '../../domain/offres-emploi'
import { PoleEmploiClient } from '../clients/pole-emploi-client'
import {
  toOffresEmploiQueryModel,
  toOffreEmploiQueryModel
} from './mappers/offres-emploi.mappers'

@Injectable()
export class OffresEmploiHttpRepository implements OffresEmploi.Repository {
  constructor(private poleEmploiClient: PoleEmploiClient) {}

  async findAll(
    page: number,
    limit: number,
    alternance: boolean,
    query?: string,
    departement?: string
  ): Promise<OffresEmploiQueryModel> {
    const params = new URLSearchParams()
    params.append('sort', '1')
    params.append('range', this.generateRange(page, limit))

    if (query) {
      params.append('motsCles', query)
    }
    if (departement) {
      params.append('departement', departement)
    }
    if (alternance) {
      params.append('natureContrat', 'E2')
    }

    const response = await this.poleEmploiClient.get(
      'offresdemploi/v2/offres/search',
      params
    )

    return toOffresEmploiQueryModel(page, limit, response.data)
  }

  async getOffreEmploiQueryModelById(
    idOffreEmploi: string
  ): Promise<OffreEmploiQueryModel | undefined> {
    const response = await this.poleEmploiClient.get(
      `offresdemploi/v2/offres/${idOffreEmploi}`
    )

    if (response.status !== 200) {
      return undefined
    }

    return toOffreEmploiQueryModel(response.data)
  }

  generateRange(page: number, limit: number): string {
    return `${(page - 1) * limit}-${page * limit - 1}`
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

export interface OffresEmploiDto {
  resultats: OffreEmploiDto[]
}
