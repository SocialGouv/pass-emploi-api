import { Recherche } from '../../../domain/offre/recherche/recherche'
import { RechercheQueryModel } from '../query-models/recherches.query-model'

export function toRechercheQueryModel(
  recherche: Recherche
): RechercheQueryModel {
  return {
    id: recherche.id,
    titre: recherche.titre,
    type: recherche.type,
    metier: recherche.metier,
    localisation: recherche.localisation,
    criteres: recherche.criteres
  }
}
