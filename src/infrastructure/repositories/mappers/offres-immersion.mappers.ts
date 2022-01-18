import {
  OffreImmersionQueryModel,
  DetailOffreImmersionQueryModel,
  ContactImmersionQueryModel,
  LocalisationQueryModel,
  FavoriOffreImmersionIdQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
import { OffreImmersion, OffresImmersion } from 'src/domain/offre-immersion'
import { FavoriOffreImmersionSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'

interface OffreImmpersionDto {
  id: string
  rome: string
  romeLabel: string
  naf: string
  nafLabel: string
  siret: string
  name: string
  voluntaryToImmersion: boolean
  location?: { lat: number; lon: number }
  address: string
  city: string
  distance_m?: number
  contactId?: string
  contactMode?: 'UNKNOWN' | 'EMAIL' | 'PHONE' | 'IN_PERSON' | undefined
  contactDetails:
    | {
        id: string
        lastName: string
        firstName: string
        role: string
        email?: string
        phone?: string
      }
    | undefined
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
  offresImmersionDto: OffreImmpersionDto
): OffreImmersionQueryModel {
  return {
    id: offresImmersionDto.id,
    metier: offresImmersionDto.romeLabel,
    nomEtablissement: offresImmersionDto.name,
    secteurActivite: offresImmersionDto.nafLabel,
    ville: offresImmersionDto.city
  }
}

export function toDetailOffreImmersionQueryModel(
  offreImmpersionDto: OffreImmpersionDto
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
  offreImmpersionDto: OffreImmpersionDto
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
  offreImmpersionDto: OffreImmpersionDto
): ContactImmersionQueryModel | undefined {
  const fromContactMode = {
    UNKNOWN: OffresImmersion.MethodeDeContact.INCONNU,
    EMAIL: OffresImmersion.MethodeDeContact.EMAIL,
    PHONE: OffresImmersion.MethodeDeContact.TELEPHONE,
    IN_PERSON: OffresImmersion.MethodeDeContact.PRESENTIEL
  }

  if (!offreImmpersionDto.contactDetails) {
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
