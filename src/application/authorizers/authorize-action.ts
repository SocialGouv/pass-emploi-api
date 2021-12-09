import { Action } from 'src/domain/action'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'

export function authorizeAction(
  utilisateur: Authentification.Utilisateur,
  action: Action | undefined
): void {
  if (utilisateur && action) {
    if (
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === action.idJeune
    ) {
      return
    }
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.id === action.idConseiller
    ) {
      return
    }
  }

  throw new Unauthorized('Action')
}
