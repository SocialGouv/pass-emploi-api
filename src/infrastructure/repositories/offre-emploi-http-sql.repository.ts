import { Injectable, Logger } from '@nestjs/common'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiQueryModel,
  OffreEmploiResumeQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import { OffresEmploi, OffreEmploi } from '../../domain/offre-emploi'
import { PoleEmploiClient } from '../clients/pole-emploi-client'
import { FavoriOffreEmploiSqlModel } from '../sequelize/models/favori-offre-emploi.sql-model'
import {
  toOffresEmploiQueryModel,
  toOffreEmploiQueryModel,
  toFavoriOffreEmploiSqlModel,
  toOffreEmploi,
  fromSqlToFavorisOffresEmploiIdsQueryModels,
  toPoleEmploiContrat
} from './mappers/offres-emploi.mappers'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { DateService } from '../../utils/date-service'
import { URLSearchParams } from 'url'

@Injectable()
export class OffresEmploiHttpSqlRepository implements OffresEmploi.Repository {
  private logger: Logger

  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private dateService: DateService
  ) {
    this.logger = new Logger('OffresEmploiHttpSqlRepository')
  }

  async findAll(
    criteres: OffresEmploi.Criteres
  ): Promise<Result<OffresEmploiQueryModel>> {
    return this.trouverLesOffres(criteres)
  }

  private async trouverLesOffres(
    criteres: OffresEmploi.Criteres,
    secondesAAttendre?: number
  ): Promise<Result<OffresEmploiQueryModel>> {
    if (secondesAAttendre) {
      await new Promise(resolve =>
        setTimeout(resolve, secondesAAttendre * 1000)
      )
    }

    try {
      const params = this.construireLesParams(criteres)
      const response = await this.poleEmploiClient.get(
        'offresdemploi/v2/offres/search',
        params
      )
      return success(
        toOffresEmploiQueryModel(criteres.page, criteres.limit, response.data)
      )
    } catch (e) {
      this.logger.error(e)
      const cestLePremierAppel = !secondesAAttendre
      if (
        cestLePremierAppel &&
        e.response?.status === 429 &&
        e.response?.headers &&
        e.response?.headers['retry-after']
      ) {
        this.logger.log('Retry de la requête')
        return this.trouverLesOffres(
          criteres,
          parseInt(e.response?.headers['retry-after'])
        )
      }

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
    await FavoriOffreEmploiSqlModel.create(
      toFavoriOffreEmploiSqlModel(idJeune, offreEmploi)
    )
  }

  async getFavorisIdsQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriOffreEmploiIdQueryModel[]> {
    const favorisIdsSql = await FavoriOffreEmploiSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      }
    })

    return fromSqlToFavorisOffresEmploiIdsQueryModels(favorisIdsSql)
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

  private construireLesParams(
    criteres: OffresEmploi.Criteres
  ): URLSearchParams {
    const {
      page,
      limit,
      q,
      departement,
      alternance,
      experience,
      duree,
      contrat,
      commune,
      rayon,
      minDateCreation
    } = criteres
    const params = new URLSearchParams()
    params.append('sort', '1')
    params.append('range', this.generateRange(page, limit))

    if (q) {
      params.append('motsCles', q)
    }
    if (departement) {
      params.append('departement', departement)
    }
    if (alternance) {
      params.append('natureContrat', 'E2,FS')
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
    if (minDateCreation) {
      params.append(
        'minCreationDate',
        minDateCreation
          .toUTC()
          .set({ millisecond: 0 })
          .toISO({ suppressMilliseconds: true })
      )
      params.append(
        'maxCreationDate',
        this.dateService
          .now()
          .toUTC()
          .set({ millisecond: 0 })
          .toISO({ suppressMilliseconds: true })
      )
    }
    return params
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
    partenaires?: Array<{ url?: string }>
  }
  alternance?: boolean
}

export interface OffresEmploiDto {
  resultats: OffreEmploiDto[]
}
