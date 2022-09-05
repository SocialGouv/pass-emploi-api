import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Contrat,
  Duree,
  Experience,
  OffresEmploi
} from '../../domain/offre-emploi'
import { OffresEmploiQueryModel } from './query-models/offres-emploi.query-model'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { FindAllOffresEmploiQueryGetter } from './query-getters/find-all-offres-emploi.query.getter'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

export interface GetOffresEmploiQuery extends Query {
  page?: number
  limit?: number
  q?: string
  departement?: string
  alternance?: boolean
  experience?: Experience[]
  debutantAccepte?: boolean
  contrat?: Contrat[]
  duree?: Duree[]
  rayon?: number
  commune?: string
}

@Injectable()
export class GetOffresEmploiQueryHandler extends QueryHandler<
  GetOffresEmploiQuery,
  Result<OffresEmploiQueryModel>
> {
  constructor(
    private findAllOffresEmploiQueryGetter: FindAllOffresEmploiQueryGetter,
    private evenementService: EvenementService
  ) {
    super('GetOffresEmploiQueryHandler')
  }

  async handle(
    query: GetOffresEmploiQuery
  ): Promise<Result<OffresEmploiQueryModel>> {
    const criteres: OffresEmploi.Criteres = {
      ...query,
      page: query.page || DEFAULT_PAGE,
      limit: query.limit || DEFAULT_LIMIT
    }
    return this.findAllOffresEmploiQueryGetter.handle(criteres)
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    query: GetOffresEmploiQuery
  ): Promise<void> {
    const evenementType =
      query.alternance === true
        ? Evenement.Type.OFFRE_ALTERNANCE_RECHERCHEE
        : Evenement.Type.OFFRE_EMPLOI_RECHERCHEE
    await this.evenementService.creerEvenement(evenementType, utilisateur)
  }
}
