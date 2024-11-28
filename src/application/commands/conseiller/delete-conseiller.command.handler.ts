import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../../domain/authentification'
import { Evenement, EvenementService } from '../../../domain/evenement'

import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../../domain/milo/conseiller'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'

export interface DeleteConseillerCommand {
  idConseiller: string
}

@Injectable()
export class DeleteConseillerCommandHandler extends CommandHandler<
  DeleteConseillerCommand,
  void
> {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private readonly conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private evenementService: EvenementService,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('DeleteConseillerCommandHandler')
  }

  async authorize(
    command: DeleteConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur
    )
  }

  async handle(command: DeleteConseillerCommand): Promise<Result> {
    const { idConseiller } = command
    const conseiller = await this.conseillerRepository.get(idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', idConseiller))
    }

    const jeunesDuConseiller =
      await this.jeuneRepository.findAllJeunesByConseiller(idConseiller)
    if (jeunesDuConseiller.length) {
      return failure(
        new MauvaiseCommandeError(
          'Le conseiller doit avoir un portefeuille vide'
        )
      )
    }

    const jeunesAvecConseillerInitial =
      await this.jeuneRepository.findAllJeunesByConseillerInitial(
        command.idConseiller
      )
    const jeunesSansConseillerInitial = jeunesAvecConseillerInitial.map(
      jeune => ({
        ...jeune,
        conseillerInitial: undefined
      })
    )
    await this.jeuneRepository.saveAllJeuneTransferes(
      jeunesSansConseillerInitial
    )

    await this.authentificationRepository.deleteUtilisateurIdp(idConseiller)
    await this.conseillerRepository.delete(idConseiller)

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.COMPTE_SUPPRIME,
      utilisateur
    )
  }
}
