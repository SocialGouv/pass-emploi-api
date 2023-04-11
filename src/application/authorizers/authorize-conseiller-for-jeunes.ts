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
export class AuthorizeConseillerForJeunes {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idsJeunes: string[],
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type !== Authentification.Type.CONSEILLER) {
      return failure(new DroitsInsuffisants())
    }

    const jeunes = await this.jeuneRepository.findAllJeunesByIdsAndConseiller(
      idsJeunes,
      utilisateur.id
    )

    if (jeunes.length !== idsJeunes.length) {
      return failure(new DroitsInsuffisants())
    }

    return emptySuccess()
  }
}
