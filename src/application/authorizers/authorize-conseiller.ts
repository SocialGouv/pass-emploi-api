import { Inject, Injectable } from '@nestjs/common'
import { Conseiller, ConseillersRepositoryToken } from 'src/domain/conseiller'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Core } from '../../domain/core'

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
  ): Promise<void> {
    const conseiller = await this.conseillerRepository.get(idConseiller)

    if (
      conseiller &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.id === conseiller.id
    ) {
      if (idJeune) {
        const jeune = await this.jeuneRepository.get(idJeune)
        if (jeune && jeune.conseiller.id === utilisateur.id) {
          return
        }
      } else {
        return
      }
    }

    throw new Unauthorized('Conseiller')
  }

  async authorizeSuperviseurStructure(
    utilisateur: Authentification.Utilisateur,
    structure: Core.Structure
  ): Promise<void> {
    const conseiller = await this.conseillerRepository.get(utilisateur.id)
    if (!conseiller) {
      throw new NonTrouveError('Conseiller', utilisateur.id)
    }

    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.roles.includes(Authentification.Role.SUPERVISEUR) &&
      utilisateur.structure === structure
    ) {
      return
    }

    throw new DroitsInsuffisants()
  }
}
