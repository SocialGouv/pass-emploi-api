import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { URLSearchParams } from 'url'
import {
  isSuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import { PoleEmploiClient } from '../../../infrastructure/clients/pole-emploi-client'
import {
  toOffresEmploiQueryModel,
  toPoleEmploiContrat
} from '../../../infrastructure/repositories/mappers/offres-emploi.mappers'
import { DateService } from '../../../utils/date-service'
import { GetOffresEmploiQuery } from '../get-offres-emploi.query.handler'
import { OffresEmploiQueryModel } from '../query-models/offres-emploi.query-model'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

@Injectable()
export class FindAllOffresEmploiQueryGetter {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private dateService: DateService
  ) {}

  async handle(
    query: GetOffresEmploiQuery
  ): Promise<Result<OffresEmploiQueryModel>> {
    const pageAvecDefault = query.page || DEFAULT_PAGE
    const limitAvecDefault = query.limit || DEFAULT_LIMIT
    const params = this.construireLesParams(
      query,
      pageAvecDefault,
      limitAvecDefault
    )
    const result = await this.poleEmploiClient.getOffresEmploi(params)

    if (isSuccess(result)) {
      const { total, resultats } = result.data
      return success(
        toOffresEmploiQueryModel(
          pageAvecDefault,
          limitAvecDefault,
          total,
          resultats
        )
      )
    }
    return result
  }

  private construireLesParams(
    criteres: GetOffresEmploiQuery,
    page: number,
    limit: number
  ): URLSearchParams {
    const {
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
    if (alternance === 'true') {
      params.append('natureContrat', 'E2,FS')
    } else if (alternance === 'false') {
      params.append('natureContrat', 'CC,FT,EE,CU,CI,FU,ER,I1,FJ,PS,PR')
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
        DateTime.fromISO(minDateCreation)
          .set({ millisecond: 0 })
          .toUTC()
          .toISO({ suppressMilliseconds: true })
      )
      params.append(
        'maxCreationDate',
        this.dateService
          .now()
          .set({ millisecond: 0 })
          .toUTC()
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
