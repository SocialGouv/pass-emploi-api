import { Action } from './action'
import { Authentification } from '../authentification'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Jeune } from '../jeune/jeune'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'

export interface Milo extends Action.Qualifiee {
  idDossier: string
  loginConseiller: string
}

export namespace Milo {
  export interface Repository {
    save(action: Action.Milo): Promise<Result>
  }

  export function creer(
    action: Action.Qualifiee,
    jeune: Jeune,
    utilisateur: Authentification.Utilisateur
  ): Result<Milo> {
    if (!jeune.idPartenaire) {
      return failure(new MauvaiseCommandeError("Le jeune n’a pas d'id dossier"))
    }

    if (!utilisateur.username) {
      return failure(
        new MauvaiseCommandeError("L'utilisateur n'a pas d'username")
      )
    }

    const data: Milo = {
      ...action,
      idDossier: jeune.idPartenaire,
      loginConseiller: utilisateur.username
    }
    return success(data)
  }
}
