import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Core, estUtilisateurDeLaStructure } from '../../domain/core'

@Injectable()
export class JeuneAuthorizer {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async autoriserLeJeune(
    idJeune: string,
    utilisateur: Authentification.Utilisateur,
    structuresAutorisees?: Core.Structure[]
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.JEUNE &&
      estUtilisateurDeLaStructure(utilisateur, structuresAutorisees)
    ) {
      const jeune = await this.jeuneRepository.existe(idJeune)

      if (jeune && utilisateur.id === idJeune) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
