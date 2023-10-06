import {
  ContactImmersionQueryModel,
  DetailOffreImmersionQueryModel,
  FavoriOffreImmersionIdQueryModel,
  FavoriOffreImmersionQueryModel,
  LocalisationQueryModel,
  OffreImmersionQueryModel
} from '../../../application/queries/query-models/offres-immersion.query-model'
import { Offre } from '../../../domain/offre/offre'
import { FavoriOffreImmersionSqlModel } from '../../sequelize/models/favori-offre-immersion.sql-model'
import { PartenaireImmersion } from '../dto/immersion.dto'

const fromContactMode = {
  UNKNOWN: Offre.Immersion.MethodeDeContact.INCONNU,
  EMAIL: Offre.Immersion.MethodeDeContact.EMAIL,
  PHONE: Offre.Immersion.MethodeDeContact.TELEPHONE,
  IN_PERSON: Offre.Immersion.MethodeDeContact.PRESENTIEL
}

export function fromSqlToFavorisOffresImmersionIdsQueryModels(
  favorisIdsSql: FavoriOffreImmersionSqlModel[]
): FavoriOffreImmersionIdQueryModel[] {
  return favorisIdsSql.map(favori => {
    return { id: favori.idOffre }
  })
}

export function fromSqlToFavorisOffreImmersion(
  offreImmersionFavoriSql: FavoriOffreImmersionSqlModel
): Offre.Favori.Immersion {
  return {
    id: offreImmersionFavoriSql.idOffre,
    metier: offreImmersionFavoriSql.metier,
    nomEtablissement: offreImmersionFavoriSql.nomEtablissement,
    secteurActivite: offreImmersionFavoriSql.secteurActivite,
    ville: offreImmersionFavoriSql.ville
  }
}

export function fromSqlToFavorisOffreImmersionQueryModel(
  offreImmersionFavoriSql: FavoriOffreImmersionSqlModel
): FavoriOffreImmersionQueryModel {
  return {
    id: offreImmersionFavoriSql.idOffre,
    metier: offreImmersionFavoriSql.metier,
    nomEtablissement: offreImmersionFavoriSql.nomEtablissement,
    secteurActivite: offreImmersionFavoriSql.secteurActivite,
    ville: offreImmersionFavoriSql.ville
  }
}

export function toOffreImmersionQueryModel(
  offreImmersionDto: PartenaireImmersion.DtoV2
): OffreImmersionQueryModel {
  return {
    id: `${offreImmersionDto.siret}-${offreImmersionDto.rome}`,
    metier: offreImmersionDto.romeLabel,
    nomEtablissement: offreImmersionDto.name,
    secteurActivite: offreImmersionDto.nafLabel,
    ville: offreImmersionDto.address.city,
    estVolontaire: offreImmersionDto.voluntaryToImmersion
  }
}

export function toDetailOffreImmersionQueryModel(
  offreImmersionDto: PartenaireImmersion.Dto
): DetailOffreImmersionQueryModel {
  return {
    id: offreImmersionDto.id,
    codeRome: offreImmersionDto.rome,
    siret: offreImmersionDto.siret,
    metier: offreImmersionDto.romeLabel,
    nomEtablissement: offreImmersionDto.name,
    secteurActivite: offreImmersionDto.nafLabel,
    ville: offreImmersionDto.city,
    adresse: offreImmersionDto.address,
    estVolontaire: offreImmersionDto.voluntaryToImmersion,
    localisation: buildLocalisation(offreImmersionDto),
    contact: buildContact(offreImmersionDto)
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
  return {
    modeDeContact: offreImmpersionDto.contactMode
      ? fromContactMode[offreImmpersionDto.contactMode]
      : Offre.Immersion.MethodeDeContact.INCONNU
  }
}
