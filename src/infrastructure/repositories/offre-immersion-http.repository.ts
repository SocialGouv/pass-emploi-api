import { Injectable } from '@nestjs/common'
import {
  ContactImmersionQueryModel,
  DetailOffreImmersionQueryModel,
  LocalisationQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
import {
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve,
  RechercheOffreInvalide
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { OffresImmersion } from '../../domain/offre-immersion'
import { ImmersionClient } from '../clients/immersion-client'

@Injectable()
export class OffresImmersionHttpRepository
  implements OffresImmersion.Repository
{
  constructor(private immersionClient: ImmersionClient) {}

  async findAll(
    rome: string,
    lat: number,
    lon: number
  ): Promise<Result<OffreImmersionQueryModel[]>> {
    const payload = {
      rome,
      location: {
        lat,
        lon
      },
      distance_km: 10
    }

    try {
      const response = await this.immersionClient.post(
        'search-immersion',
        payload
      )

      return success(response.data.map(toOffreImmersionQueryModel))
    } catch (e) {
      if (e.response.status === 400) {
        const message = e.response.data.errors
          .map((error: { message: string }) => error.message)
          .join(' - ')
        return failure(new RechercheOffreInvalide(message))
      }
      throw e
    }
  }
  async get(
    idOffreImmersion: string
  ): Promise<Result<DetailOffreImmersionQueryModel>> {
    try {
      const response = await this.immersionClient.get(
        `/get-immersion-by-id/${idOffreImmersion}`
      )
      return success(toDetailOffreImmersionQueryModel(response.data))
    } catch (e) {
      if (e.response.status === 404) {
        const message = `Offre d'immersion ${idOffreImmersion} not found`
        return failure(new RechercheDetailOffreNonTrouve(message))
      }
      return failure(new RechercheDetailOffreInvalide(e.response.data.errors))
    }
  }
}

export interface OffreImmpersionDto {
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

function toOffreImmersionQueryModel(
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

function toDetailOffreImmersionQueryModel(
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

function buildLocalisation(
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

function buildContact(
  offreImmpersionDto: OffreImmpersionDto
): ContactImmersionQueryModel | undefined {
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

const fromContactMode = {
  UNKNOWN: OffresImmersion.MethodeDeContact.INCONNU,
  EMAIL: OffresImmersion.MethodeDeContact.EMAIL,
  PHONE: OffresImmersion.MethodeDeContact.TELEPHONE,
  IN_PERSON: OffresImmersion.MethodeDeContact.PRESENTIEL
}
