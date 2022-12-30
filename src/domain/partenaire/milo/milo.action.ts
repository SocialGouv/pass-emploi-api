import { Action } from '../../action/action'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Jeune } from '../../jeune/jeune'
import { Authentification } from '../../authentification'
import { MauvaiseCommandeError } from '../../../building-blocks/types/domain-error'

export interface MiloAction extends Action.Qualifiee {
  idDossier: string
  loginConseiller: string
}

export namespace MiloAction {
  export interface Repository {
    save(action: MiloAction): Promise<Result>
  }

  export function creer(
    action: Action.Qualifiee,
    jeune: Jeune,
    utilisateur: Authentification.Utilisateur
  ): Result<MiloAction> {
    if (!jeune.idPartenaire) {
      return failure(new MauvaiseCommandeError("Le jeune n’a pas d'id dossier"))
    }

    if (!utilisateur.username) {
      return failure(
        new MauvaiseCommandeError("L'utilisateur n'a pas d'username")
      )
    }

    const data: MiloAction = {
      ...action,
      idDossier: jeune.idPartenaire,
      loginConseiller: utilisateur.username
    }
    return success(data)
  }
}
