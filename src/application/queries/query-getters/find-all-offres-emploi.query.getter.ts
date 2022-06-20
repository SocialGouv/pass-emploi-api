import { Injectable, Logger } from '@nestjs/common'
import { OffresEmploi } from '../../../domain/offre-emploi'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { OffresEmploiQueryModel } from '../query-models/offres-emploi.query-model'
import {
  toOffresEmploiQueryModel,
  toPoleEmploiContrat
} from '../../../infrastructure/repositories/mappers/offres-emploi.mappers'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { PoleEmploiClient } from '../../../infrastructure/clients/pole-emploi-client'
import { URLSearchParams } from 'url'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class FindAllOffresEmploiQueryGetter {
  private logger: Logger

  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private dateService: DateService
  ) {
    this.logger = new Logger('FindAllOffresEmploiQueryGetter')
  }

  async handle(
    query: OffresEmploi.Criteres
  ): Promise<Result<OffresEmploiQueryModel>> {
    return this.trouverLesOffres(query)
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
      const offresEmploiDto = await this.poleEmploiClient.getOffresEmploi(
        params
      )
      return success(
        toOffresEmploiQueryModel(criteres.page, criteres.limit, offresEmploiDto)
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
      debutantAccepte,
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
    if (debutantAccepte) {
      params.append('experienceExigence', 'D')
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

  private generateRange(page: number, limit: number): string {
    return `${(page - 1) * limit}-${page * limit - 1}`
  }
}

function buildQueryParamFromArray(array: string[]): string {
  let queryParam = ''
  array.forEach((value: string, index: number, arr: string[]) => {
    queryParam += index !== arr.length - 1 ? `${value},` : `${value}`
  })
  return queryParam
}
