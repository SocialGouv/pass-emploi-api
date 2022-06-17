import {
  ContactImmersionQueryModel,
  DetailOffreImmersionQueryModel,
  FavoriOffreImmersionIdQueryModel,
  LocalisationQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-model'
import { OffreImmersion, OffresImmersion } from 'src/domain/offre-immersion'
import { FavoriOffreImmersionSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { PartenaireImmersion } from '../dto/immersion.dto'

const fromContactMode = {
  UNKNOWN: OffresImmersion.MethodeDeContact.INCONNU,
  EMAIL: OffresImmersion.MethodeDeContact.EMAIL,
  PHONE: OffresImmersion.MethodeDeContact.TELEPHONE,
  IN_PERSON: OffresImmersion.MethodeDeContact.PRESENTIEL
}

export function fromSqlToFavorisOffresImmersionIdsQueryModels(
  favorisIdsSql: FavoriOffreImmersionSqlModel[]
): FavoriOffreImmersionIdQueryModel[] {
  return favorisIdsSql.map(favori => {
    return { id: favori.idOffre }
  })
}

export function fromSqlToOffreImmersion(
  offresImmersionFavoriSql: FavoriOffreImmersionSqlModel
): OffreImmersion {
  return {
    id: offresImmersionFavoriSql.idOffre,
    metier: offresImmersionFavoriSql.metier,
    nomEtablissement: offresImmersionFavoriSql.nomEtablissement,
    secteurActivite: offresImmersionFavoriSql.secteurActivite,
    ville: offresImmersionFavoriSql.ville
  }
}

export function toOffreImmersionQueryModel(
  offresImmersionDto: PartenaireImmersion.DtoV1
): OffreImmersionQueryModel {
  return {
    id: `${offresImmersionDto.siret}-${offresImmersionDto.rome}`,
    metier: offresImmersionDto.romeLabel,
    nomEtablissement: offresImmersionDto.name,
    secteurActivite: offresImmersionDto.nafLabel,
    ville: offresImmersionDto.city
  }
}

export function toDetailOffreImmersionQueryModel(
  offreImmpersionDto: PartenaireImmersion.Dto
): DetailOffreImmersionQueryModel {
  return {
    id: offreImmpersionDto.id,
    metier: offreImmpersionDto.romeLabel,
    nomEtablissement: offreImmpersionDto.name,
    secteurActivite: offreImmpersionDto.nafLabel,
    ville: offreImmpersionDto.city,
    adresse: offreImmpersionDto.address,
    estVolontaire: offreImmpersionDto.voluntaryToImmersion,
    localisation: buildLocalisation(offreImmpersionDto),
    contact: buildContact(offreImmpersionDto)
  }
}

export function buildLocalisation(
  offreImmpersionDto: PartenaireImmersion.Dto
): LocalisationQueryModel | undefined {
  if (!offreImmpersionDto.location) {
    return undefined
  }
  return {
    latitude: offreImmpersionDto.location.lat,
    longitude: offreImmpersionDto.location.lon
  }
}

export function buildContact(
  offreImmpersionDto: PartenaireImmersion.Dto
): ContactImmersionQueryModel | undefined {
  if (
    !offreImmpersionDto.contactDetails ||
    !offreImmpersionDto.contactDetails.id ||
    !offreImmpersionDto.contactDetails.firstName ||
    !offreImmpersionDto.contactDetails.lastName ||
    !offreImmpersionDto.contactDetails.role
  ) {
    return undefined
  }

  return {
    id: offreImmpersionDto.contactDetails.id,
    nom: offreImmpersionDto.contactDetails.firstName,
    prenom: offreImmpersionDto.contactDetails.lastName,
    telephone: offreImmpersionDto.contactDetails.phone,
    email: offreImmpersionDto.contactDetails.email,
    role: offreImmpersionDto.contactDetails.role,
    modeDeContact: offreImmpersionDto.contactMode
      ? fromContactMode[offreImmpersionDto.contactMode]
      : undefined
  }
}
