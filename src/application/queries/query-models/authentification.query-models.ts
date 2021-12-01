import { Authentification } from '../../../domain/authentification'

export class UtilisateurQueryModel implements Authentification.Utilisateur {
  id: string
  prenom: string
  nom: string
  email?: string
  structure: Authentification.Structure
  type: Authentification.Type
}
