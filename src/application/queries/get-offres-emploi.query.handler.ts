import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Contrat,
  Duree,
  Experience,
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import { OffresEmploiQueryModel } from './query-models/offres-emploi.query-models'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

export interface GetOffresEmploiQuery extends Query {
  page?: number
  limit?: number
  query?: string
  departement?: string
  alternance?: boolean
  experience?: Experience[]
  contrat?: Contrat[]
  duree?: Duree[]
  rayon?: number
  commune?: string
}

@Injectable()
export class GetOffresEmploiQueryHandler extends QueryHandler<
  GetOffresEmploiQuery,
  OffresEmploiQueryModel
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository,
    private evenementService: EvenementService
  ) {
    super('GetOffresEmploiQueryHandler')
  }

  async handle(query: GetOffresEmploiQuery): Promise<OffresEmploiQueryModel> {
    return this.offresEmploiRepository.findAll(
      query.page || DEFAULT_PAGE,
      query.limit || DEFAULT_LIMIT,
      query.alternance,
      query.query,
      query.departement,
      query.experience,
      query.duree,
      query.contrat,
      query.rayon,
      query.commune
    )
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetOffresEmploiQuery
  ): Promise<void> {
    return
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
