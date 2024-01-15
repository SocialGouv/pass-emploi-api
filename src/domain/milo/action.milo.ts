import { Action } from '../action/action'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Jeune } from '../jeune/jeune'
import { Authentification } from '../authentification'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'

export const ActionMiloRepositoryToken = 'ActionMiloRepositoryToken'

export interface ActionMilo extends Action.Qualifiee {
  idDossier: string
  loginConseiller: string
}

export namespace ActionMilo {
  export interface Repository {
    save(action: ActionMilo): Promise<Result>
  }

  export function creer(
    action: Action.Qualifiee,
    jeune: Jeune,
    utilisateur: Authentification.Utilisateur
  ): Result<ActionMilo> {
    if (!jeune.idPartenaire) {
      return failure(
        new MauvaiseCommandeError(`Le jeune ${jeune.id} n'a pas d'id dossier`)
      )
    }

    if (!utilisateur.username) {
      return failure(
        new MauvaiseCommandeError("L'utilisateur n'a pas d'username")
      )
    }

    const data: ActionMilo = {
      ...action,
      idDossier: jeune.idPartenaire,
      loginConseiller: utilisateur.username
    }
    return success(data)
  }
}
