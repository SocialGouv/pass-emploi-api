import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { DetailServiceCiviqueQueryModel } from './query-models/service-civique.query-model'
import {
  OffreServiceCiviqueRepositoryToken,
  OffreServiceCivique
} from '../../domain/offre-service-civique'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'

export interface GetDetailOffreServiceCiviqueQuery extends Query {
  idOffre: string
}

@Injectable()
export class GetDetailServiceCiviqueQueryHandler extends QueryHandler<
  GetDetailOffreServiceCiviqueQuery,
  Result<DetailServiceCiviqueQueryModel>
> {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private offreServiceCiviqueRepository: OffreServiceCivique.Repository,
    private evenementService: EvenementService
  ) {
    super('GetDetailServiceCiviqueQueryHandler')
  }

  async handle(
    query: GetDetailOffreServiceCiviqueQuery
  ): Promise<Result<DetailServiceCiviqueQueryModel>> {
    const result =
      await this.offreServiceCiviqueRepository.getServiceCiviqueById(
        query.idOffre
      )

    if (isFailure(result)) {
      return result
    }

    const offreQueryModel: DetailServiceCiviqueQueryModel = {
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

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHEE,
      utilisateur
    )
  }
}
