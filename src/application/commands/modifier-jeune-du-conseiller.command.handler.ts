import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Command } from '../../building-blocks/types/command'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { Core } from '../../domain/core'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'

export interface ModifierJeuneDuConseillerCommand extends Command {
  idPartenaire: string
  idJeune: string
}

@Injectable()
export class ModifierJeuneDuConseillerCommandHandler extends CommandHandler<
  ModifierJeuneDuConseillerCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer
  ) {
    super('ModifierJeuneDuConseillerCommandHandler')
  }

  async handle(command: ModifierJeuneDuConseillerCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const jeuneMisAJour = Jeune.mettreAJourIdPartenaire(
      jeune,
      command.idPartenaire
    )

    await this.jeuneRepository.save(jeuneMisAJour)

    return emptySuccess()
  }

  async authorize(
    command: ModifierJeuneDuConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.structure !== Core.Structure.POLE_EMPLOI &&
      utilisateur.structure !== Core.Structure.PASS_EMPLOI
    ) {
      return failure(new DroitsInsuffisants())
    }
    return this.conseillerForJeuneAuthorizer.authorize(
      command.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
