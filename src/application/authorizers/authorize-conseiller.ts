import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from 'src/domain/conseiller'
import { Unauthorized } from 'src/domain/erreur'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
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

  async authorizeConseiller(
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const conseiller = await this.conseillerRepository.get(utilisateur.id)

    if (conseiller && utilisateur.type === Authentification.Type.CONSEILLER) {
      return
    }

    throw new DroitsInsuffisants()
  }

  async authorizeSuperviseur(
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const conseiller = await this.conseillerRepository.get(utilisateur.id)

    if (
      conseiller &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      Authentification.estSuperviseur(utilisateur)
    ) {
      return
    }

    throw new DroitsInsuffisants()
  }
}
