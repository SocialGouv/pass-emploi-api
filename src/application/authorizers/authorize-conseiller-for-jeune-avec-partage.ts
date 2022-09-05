import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'

@Injectable()
export class ConseillerForJeuneAvecPartageAuthorizer {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const jeune = await this.jeuneRepository.get(idJeune)

    if (jeune && utilisateur) {
      if (
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.id === jeune.conseiller?.id &&
        jeune.preferences.partageFavoris
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
