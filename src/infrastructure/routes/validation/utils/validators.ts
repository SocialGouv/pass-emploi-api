import { CreateRecherchePayload } from '../recherches.inputs'
import { Recherche } from '../../../../domain/recherche'
import { GetOffresImmersionQueryParams } from '../offres-immersion.inputs'

export function isCriteresValid(payload: CreateRecherchePayload): boolean {
  return (
    (payload.type === Recherche.Type.OFFRES_IMMERSION &&
      payload.criteres instanceof GetOffresImmersionQueryParams) ||
    payload.type === Recherche.Type.OFFRES_ALTERNANCE ||
    payload.type === Recherche.Type.OFFRES_EMPLOI
  )
}
