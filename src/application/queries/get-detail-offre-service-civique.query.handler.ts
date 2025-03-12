import { Injectable } from '@nestjs/common'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { EngagementClient } from '../../infrastructure/clients/engagement-client'
import {
  DetailOffreEngagementDto,
  OffreEngagementDto
} from '../../infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { DetailServiceCiviqueQueryModel } from './query-models/service-civique.query-model'

export interface GetDetailOffreServiceCiviqueQuery extends Query {
  idOffre: string
}

@Injectable()
export class GetDetailOffreServiceCiviqueQueryHandler extends QueryHandler<
  GetDetailOffreServiceCiviqueQuery,
  Result<DetailServiceCiviqueQueryModel>
> {
  constructor(
    private engagementClient: EngagementClient,
    private evenementService: EvenementService
  ) {
    super('GetDetailServiceCiviqueQueryHandler')
  }

  async handle(
    query: GetDetailOffreServiceCiviqueQuery
  ): Promise<Result<DetailServiceCiviqueQueryModel>> {
    try {
      const response =
        await this.engagementClient.get<DetailOffreEngagementDto>(
          `v0/mission/${query.idOffre}`
        )
      return success(dtoToDetailServiceCiviqueQueryModel(response.data.data))
    } catch (e) {
      this.logger.error(e)
      if (e.response?.status >= 400 && e.response?.status < 500) {
        if (e.response?.status == 404) {
          const erreur = new NonTrouveError('OffreEngagement', query.idOffre)
          return failure(erreur)
        } else {
          const erreur = new ErreurHttp(
            e.response.data?.message,
            e.response.status
          )
          return failure(erreur)
        }
      }
      return failure(e)
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.evenementService.creer(
        Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHE,
        utilisateur
      )
    }
  }
}

function dtoToDetailServiceCiviqueQueryModel(
  dto: OffreEngagementDto
): DetailServiceCiviqueQueryModel {
  return {
    titre: dto.title,
    dateDeDebut: dto.startAt,
    dateDeFin: dto.endAt,
    domaine: dto.domain,
    ville: dto.city,
    organisation: dto.organizationName,
    lienAnnonce: dto.applicationUrl,
    urlOrganisation: dto.organizationUrl,
    adresseMission: dto.address,
    adresseOrganisation: dto.organizationFullAddress,
    codeDepartement: dto.departmentCode,
    description: dto.description,
    codePostal: dto.postalCode,
    descriptionOrganisation: dto.organizationDescription
  }
}
