import { Localisation } from 'src/domain/offre/favori/offre-service-civique'
import { Offre } from '../../../domain/offre/offre'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import {
  EngagementDto,
  OffreEngagementDto
} from '../offre/offre-service-civique-http.repository.db'

export function toOffresServicesCivique(servicesCiviqueDto: EngagementDto): {
  total: number
  results: Offre.Favori.ServiceCivique[]
} {
  return {
    total: servicesCiviqueDto.total,
    results: servicesCiviqueDto.hits
      .filter(offre => !offre.deleted)
      .map(toOffreEngagement)
  }
}

export function toOffreEngagement(
  serviceCiviqueDto: OffreEngagementDto
): Offre.Favori.ServiceCivique {
  return {
    id: serviceCiviqueDto._id,
    titre: serviceCiviqueDto.title,
    dateDeDebut: serviceCiviqueDto.startAt,
    dateDeFin: serviceCiviqueDto.endAt,
    domaine: serviceCiviqueDto.domain,
    ville: serviceCiviqueDto.city,
    organisation: serviceCiviqueDto.organizationName,
    lienAnnonce: serviceCiviqueDto.applicationUrl,
    urlOrganisation: serviceCiviqueDto.organizationUrl,
    adresseMission: serviceCiviqueDto.address,
    adresseOrganisation: serviceCiviqueDto.organizationFullAddress,
    codeDepartement: serviceCiviqueDto.departmentCode,
    description: serviceCiviqueDto.description,
    codePostal: serviceCiviqueDto.postalCode,
    descriptionOrganisation: serviceCiviqueDto.organizationDescription,
    localisation: buildLocalisation(serviceCiviqueDto)
  }
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
