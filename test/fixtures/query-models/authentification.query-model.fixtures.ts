import { UtilisateurQueryModel } from '../../../src/application/queries/query-models/authentification.query-model'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'

export function unUtilisateurQueryModel(
  overrides: Partial<UtilisateurQueryModel> = {}
): UtilisateurQueryModel {
  const defaults: UtilisateurQueryModel = {
    id: '1',
    nom: 'Tavernier',
    prenom: 'Nils',
    type: Authentification.Type.CONSEILLER,
    email: 'nils.tavernier@passemploi.com',
    structure: Core.Structure.MILO,
    roles: [],
    username: undefined
  }
  return { ...defaults, ...overrides }
}

export const unUtilisateurSansEmailQueryModel = (): UtilisateurQueryModel =>
  unUtilisateurQueryModel({
    email: undefined
  })

export const unUtilisateurBRSAQueryModel = (): UtilisateurQueryModel =>
  unUtilisateurQueryModel({
    structure: Core.Structure.POLE_EMPLOI_BRSA
  })
