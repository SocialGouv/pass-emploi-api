import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { DetailOffreEngagementQueryModel } from './query-models/service-civique.query-models'
import {
  EngagementRepositoryToken,
  OffreEngagement
} from '../../domain/offre-engagement'
import { isFailure, Result, success } from '../../building-blocks/types/result'

export interface GetDetailServiceCiviqueQuery extends Query {
  idOffreEngagement: string
}

@Injectable()
export class GetDetailServiceCiviqueQueryHandler extends QueryHandler<
  GetDetailServiceCiviqueQuery,
  Result<DetailOffreEngagementQueryModel>
> {
  constructor(
    @Inject(EngagementRepositoryToken)
    private engagementRepository: OffreEngagement.Repository,
    private evenementService: EvenementService
  ) {
    super('GetDetailServiceCiviqueQueryHandler')
  }

  async handle(
    query: GetDetailServiceCiviqueQuery
  ): Promise<Result<DetailOffreEngagementQueryModel>> {
    const result = await this.engagementRepository.getOffreEngagementById(
      query.idOffreEngagement
    )

    if (isFailure(result)) {
      return result
    }

    const offreQueryModel: DetailOffreEngagementQueryModel = {
      domaine: result.data.domaine,
      titre: result.data.titre,
      ville: result.data.ville,
      organisation: result.data.organisation,
      dateDeDebut: result.data.dateDeDebut,
      dateDeFin: result.data.dateDeFin,
      description: result.data.description,
      lienAnnonce: result.data.lienAnnonce,
      adresseOrganisation: result.data.adresseOrganisation,
      adresseMission: result.data.adresseMission,
      urlOrganisation: result.data.urlOrganisation,
      codeDepartement: result.data.codeDepartement,
      codePostal: result.data.codePostal,
      descriptionOrganisation: result.data.descriptionOrganisation
    }

    return success(offreQueryModel)
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailServiceCiviqueQuery
  ): Promise<void> {
    return
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailServiceCiviqueQuery
  ): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_SERVICE_CIVIQUE_AFFICHE,
      utilisateur
    )
  }
}
