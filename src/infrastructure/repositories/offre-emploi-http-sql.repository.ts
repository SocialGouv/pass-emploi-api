import { Injectable } from '@nestjs/common'
import {
  FavoriIdQueryModel,
  OffreEmploiQueryModel,
  OffreEmploiResumeQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import {
  OffresEmploi,
  OffreEmploi,
  Contrat,
  Experience,
  Duree
} from '../../domain/offre-emploi'
import { PoleEmploiClient } from '../clients/pole-emploi-client'
import { FavoriOffreEmploiSqlModel } from '../sequelize/models/favori-offre-emploi.sql-model'
import {
  toOffresEmploiQueryModel,
  toOffreEmploiQueryModel,
  toFavoriOffreEmploiSqlModel,
  toOffreEmploi,
  fromSqlToFavorisIdsQueryModels,
  toPoleEmploiContrat
} from './mappers/offres-emploi.mappers'

@Injectable()
export class OffresEmploiHttpSqlRepository implements OffresEmploi.Repository {
  constructor(private poleEmploiClient: PoleEmploiClient) {}

  async findAll(
    page: number,
    limit: number,
    alternance?: boolean,
    query?: string,
    departement?: string,
    experience?: Experience[],
    duree?: Duree[],
    contrat?: Contrat[],
    rayon?: number,
    commune?: string
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
    if (experience) {
      params.append('experience', buildQueryParamFromArray(experience))
    }
    if (duree) {
      params.append('dureeHebdo', buildQueryParamFromArray(duree))
    }
    if (contrat) {
      params.append(
        'typeContrat',
        buildQueryParamFromArray(toPoleEmploiContrat(contrat))
      )
    }
    if (rayon) {
      params.append('distance', rayon.toString())
    }
    if (commune) {
      params.append('commune', commune)
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

  async getFavori(
    idJeune: string,
    idOffreEmploi: string
  ): Promise<OffreEmploi | undefined> {
    const result = await FavoriOffreEmploiSqlModel.findOne({
      where: {
        idJeune: idJeune,
        idOffre: idOffreEmploi
      }
    })
    if (!result) {
      return undefined
    }
    return toOffreEmploi(result)
  }

  async saveAsFavori(idJeune: string, offreEmploi: OffreEmploi): Promise<void> {
    await FavoriOffreEmploiSqlModel.upsert(
      toFavoriOffreEmploiSqlModel(idJeune, offreEmploi)
    )
  }

  async getFavorisIdsQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriIdQueryModel[]> {
    const favorisIdsSql = await FavoriOffreEmploiSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      }
    })

    return fromSqlToFavorisIdsQueryModels(favorisIdsSql)
  }

  async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<OffreEmploiResumeQueryModel[]> {
    const favorisSql = await FavoriOffreEmploiSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(toOffreEmploi)
  }

  async deleteFavori(idJeune: string, idOffreEmploi: string): Promise<void> {
    await FavoriOffreEmploiSqlModel.destroy({
      where: {
        idOffre: idOffreEmploi,
        idJeune
      }
    })
  }
}

function buildQueryParamFromArray(array: string[]): string {
  let queryParam = ''
  array.forEach((value: string, index: number, arr: string[]) => {
    queryParam += index !== arr.length - 1 ? `${value},` : `${value}`
  })
  return queryParam
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
