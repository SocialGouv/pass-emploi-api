import { Authentification } from '../../../domain/authentification'

export interface UtilisateurQueryModel {
  id: string
  prenom: string
  nom: string
  email?: string
  structure: Authentification.Structure
  type: Authentification.Type
}
