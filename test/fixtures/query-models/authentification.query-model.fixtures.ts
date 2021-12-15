import { UtilisateurQueryModel } from '../../../src/application/queries/query-models/authentification.query-models'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'

export const unUtilisateurQueryModel = (): UtilisateurQueryModel => ({
  id: '1',
  nom: 'Tavernier',
  prenom: 'Nils',
  type: Authentification.Type.CONSEILLER,
  email: 'nils.tavernier@passemploi.com',
  structure: Core.Structure.MILO
})
