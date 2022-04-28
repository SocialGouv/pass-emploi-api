import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { OffreEngagementQueryModel } from './query-models/service-civique.query-models'
import {
  OffreEngagement,
  EngagementRepositoryToken
} from '../../domain/offre-engagement'
import { DateTime } from 'luxon'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

export interface GetServicesCiviqueQuery extends Query {
  page?: number
  limit?: number
  lat?: number
  lon?: number
  distance?: number
  dateDeDebutMinimum?: string
  dateDeDebutMaximum?: string
  domaine?: string
}

@Injectable()
export class GetServicesCiviqueQueryHandler extends QueryHandler<
  GetServicesCiviqueQuery,
  Result<OffreEngagementQueryModel[]>
> {
  constructor(
    @Inject(EngagementRepositoryToken)
    private engagementRepository: OffreEngagement.Repository,
    private evenementService: EvenementService
  ) {
    super('GetServicesCiviqueQueryHandler')
  }

  async handle(
    query: GetServicesCiviqueQuery
  ): Promise<Result<OffreEngagementQueryModel[]>> {
    const criteres: OffreEngagement.Criteres = {
      ...query,
      distance: query.distance
        ? query.distance
        : OffreEngagement.DISTANCE_PAR_DEFAUT,
      dateDeDebutMinimum: query.dateDeDebutMinimum
        ? DateTime.fromISO(query.dateDeDebutMinimum)
        : undefined,
      dateDeDebutMaximum: query.dateDeDebutMaximum
        ? DateTime.fromISO(query.dateDeDebutMaximum)
        : undefined,
      editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE,
      page: query.page || DEFAULT_PAGE,
      limit: query.limit || DEFAULT_LIMIT
    }
    const result = await this.engagementRepository.findAll(criteres)

    if (isFailure(result)) {
      return result
    }

    const offresQueryModel: OffreEngagementQueryModel[] = result.data.map(
      offre => ({
        id: offre.id,
        titre: offre.titre,
        organisation: offre.organisation,
        ville: offre.ville,
        domaine: offre.domaine,
        dateDeDebut: offre.dateDeDebut
      })
    )

    return success(offresQueryModel)
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetServicesCiviqueQuery
  ): Promise<void> {
    return
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetServicesCiviqueQuery
  ): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.SERVICE_CIVIQUE_RECHERCHE,
      utilisateur
    )
  }
}
