import { Core } from '../../../domain/core'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import {
  EngagementDto,
  OffreEngagementDto
} from '../offre-service-civique-http.repository.db'
import { Offre } from '../../../domain/offre/offre'
import { Localisation } from 'src/domain/offre/favori/offre-service-civique'

export function toOffresServicesCivique(
  servicesCiviqueDto: EngagementDto
): Offre.Favori.ServiceCivique[] {
  return servicesCiviqueDto.hits.map(toOffreEngagement)
}

export function toOffreEngagement(
  serviceCiviqueDto: OffreEngagementDto
): Offre.Favori.ServiceCivique {
  return {
    id: serviceCiviqueDto.id,
    titre: serviceCiviqueDto.title,
    dateDeDebut: serviceCiviqueDto.startAt,
    dateDeFin: serviceCiviqueDto.endAt,
    domaine: serviceCiviqueDto.domain,
    ville: serviceCiviqueDto.city,
    organisation: serviceCiviqueDto.organizationName,
    lienAnnonce: serviceCiviqueDto.applicationUrl,
    urlOrganisation: serviceCiviqueDto.organizationUrl,
    adresseMission: serviceCiviqueDto.adresse,
    adresseOrganisation: serviceCiviqueDto.organizationFullAddress,
    codeDepartement: serviceCiviqueDto.departmentCode,
    description: serviceCiviqueDto.description,
    codePostal: serviceCiviqueDto.postalCode,
    descriptionOrganisation: serviceCiviqueDto.organizationDescription,
    localisation: buildLocalisation(serviceCiviqueDto)
  }
}

export function fromSqlToIds(
  favoriOffreEngagementSqlModels: FavoriOffreEngagementSqlModel[]
): Core.Id[] {
  return favoriOffreEngagementSqlModels.map(favori => {
    return { id: favori.idOffre }
  })
}

export function fromSqlToOffreServiceCivique(
  favoriOffreEngagementSqlModel: FavoriOffreEngagementSqlModel
): Offre.Favori.ServiceCivique {
  return {
    id: favoriOffreEngagementSqlModel.idOffre,
    domaine: favoriOffreEngagementSqlModel.domaine,
    ville: favoriOffreEngagementSqlModel.ville ?? undefined,
    titre: favoriOffreEngagementSqlModel.titre,
    organisation: favoriOffreEngagementSqlModel.organisation ?? undefined,
    dateDeDebut: favoriOffreEngagementSqlModel.dateDeDebut ?? undefined
  }
}

function buildLocalisation(
  serviceCiviqueDto: OffreEngagementDto
): Localisation | undefined {
  if (serviceCiviqueDto.location) {
    return {
      latitude: serviceCiviqueDto.location.lat,
      longitude: serviceCiviqueDto.location.lon
    }
  }
  return undefined
}
