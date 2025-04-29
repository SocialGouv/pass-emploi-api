import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
import { RendezVousAuthorizer } from '../authorizers/rendezvous-authorizer'

export interface CloreRendezVousCommand extends Command {
  idRendezVous: string
  idsJeunesPresents: string[]
}

@Injectable()
export class CloreRendezVousCommandHandler extends CommandHandler<
  CloreRendezVousCommand,
  void
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private rendezVousFactory: RendezVous.Factory
  ) {
    super('CloreRendezVousCommandHandler')
  }

  async handle(command: CloreRendezVousCommand): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(command.idRendezVous)

    if (!rendezVous) {
      return failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
    }

    const result = this.rendezVousFactory.clore(
      rendezVous,
      command.idsJeunesPresents
    )

    if (isFailure(result)) {
      return result
    }

    await this.rendezVousRepository.save(result.data)

    return emptySuccess()
  }

  async authorize(
    command: CloreRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
      command.idRendezVous,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
