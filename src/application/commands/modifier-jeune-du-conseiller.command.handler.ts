import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estPoleEmploi } from '../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

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
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
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
    return this.conseillerAuthorizer.autoriserConseillerPourSonJeune(
      command.idJeune,
      utilisateur,
      estPoleEmploi(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
