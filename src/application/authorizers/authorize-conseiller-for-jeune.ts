import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune/jeune'

@Injectable()
export class ConseillerForJeuneAuthorizer {
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
        utilisateur.id === jeune.conseiller?.id
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
