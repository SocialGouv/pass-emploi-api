import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { OffresEmploiQueryModel } from './query-models/offres-emploi.query-model'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { FindAllOffresEmploiQueryGetter } from './query-getters/find-all-offres-emploi.query.getter'
import { Offre } from '../../domain/offre/offre'

export interface GetOffresEmploiQuery extends Query {
  page?: number
  limit?: number
  q?: string
  departement?: string
  alternance?: boolean
  experience?: Offre.Emploi.Experience[]
  debutantAccepte?: boolean
  contrat?: Offre.Emploi.Contrat[]
  duree?: Offre.Emploi.Duree[]
  rayon?: number
  commune?: string
  minDateCreation?: string
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
    return this.findAllOffresEmploiQueryGetter.handle(query)
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
        ? Evenement.Code.OFFRE_ALTERNANCE_RECHERCHEE
        : Evenement.Code.OFFRE_EMPLOI_RECHERCHEE
    await this.evenementService.creer(evenementType, utilisateur)
  }
}
