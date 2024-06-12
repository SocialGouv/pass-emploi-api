import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'

@Injectable()
export class JeuneAuthorizer {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async autoriserLeJeune(
    idJeune: string,
    utilisateur: Authentification.Utilisateur,
    structureAutorisee = true
  ): Promise<Result> {
    if (Authentification.estJeune(utilisateur.type) && structureAutorisee) {
      const jeune = await this.jeuneRepository.existe(idJeune)

      if (jeune && utilisateur.id === idJeune) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants('auth_user_not_found'))
  }
}
