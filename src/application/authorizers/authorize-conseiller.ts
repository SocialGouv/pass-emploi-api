import { Inject, Injectable } from '@nestjs/common'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'

@Injectable()
export class ConseillerAuthorizer {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}
  async authorize(
    idConseiller: string,
    utilisateur: Authentification.Utilisateur,
    idJeune?: string
  ): Promise<Result> {
    const conseiller = await this.conseillerRepository.get(idConseiller)

    if (
      conseiller &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.id === conseiller.id
    ) {
      if (idJeune) {
        const jeune = await this.jeuneRepository.get(idJeune)
        if (jeune && jeune.conseiller?.id === utilisateur.id) {
          return emptySuccess()
        }
      } else {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async authorizeConseiller(
    utilisateur: Authentification.Utilisateur,
    structure?: Core.Structure
  ): Promise<Result> {
    const conseiller = await this.conseillerRepository.get(utilisateur.id)

    if (!structure || structure === utilisateur.structure) {
      if (conseiller && utilisateur.type === Authentification.Type.CONSEILLER) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async authorizeSuperviseur(
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const conseiller = await this.conseillerRepository.get(utilisateur.id)

    if (
      conseiller &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      Authentification.estSuperviseur(utilisateur)
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
