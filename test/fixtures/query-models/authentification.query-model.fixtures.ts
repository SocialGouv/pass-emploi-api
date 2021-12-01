import { UtilisateurQueryModel } from '../../../src/application/queries/query-models/authentification.query-models'
import { Authentification } from '../../../src/domain/authentification'

export const unUtilisateurQueryModel = (): UtilisateurQueryModel => ({
  id: '1',
  nom: 'Tavernier',
  prenom: 'Nils',
  type: Authentification.Type.CONSEILLER,
  email: 'nils.tavernier@passemploi.com',
  structure: Authentification.Structure.MILO
})
