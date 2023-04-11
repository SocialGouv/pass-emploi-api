import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
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

import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../../domain/conseiller/conseiller'
import { Core } from '../../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import { ConseillerAuthorizer } from '../../authorizers/authorize-conseiller'

export interface DeleteConseillerCommand {
  idConseiller: string
}

@Injectable()
export class DeleteConseillerCommandHandler extends CommandHandler<
  DeleteConseillerCommand,
  void
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
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
    if (
      utilisateur.structure === Core.Structure.POLE_EMPLOI ||
      utilisateur.structure === Core.Structure.POLE_EMPLOI_BRSA
    ) {
      return this.conseillerAuthorizer.authorize(
        command.idConseiller,
        utilisateur
      )
    }
    return failure(new DroitsInsuffisants())
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
