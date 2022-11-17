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
  AnimationCollectiveRepositoryToken,
  RendezVous
} from '../../domain/rendez-vous'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'

export interface CloturerAnimationCollectiveCommand extends Command {
  idAnimationCollective: string
  idsJeunes: string[]
}

@Injectable()
export class CloturerAnimationCollectiveCommandHandler extends CommandHandler<
  CloturerAnimationCollectiveCommand,
  void
> {
  constructor(
    @Inject(AnimationCollectiveRepositoryToken)
    private animationCollectiveRepository: RendezVous.AnimationCollective.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private animationCollectiveService: RendezVous.AnimationCollective.Service
  ) {
    super('CloturerAnimationCollectiveCommandHandler')
  }

  async handle(command: CloturerAnimationCollectiveCommand): Promise<Result> {
    const animationCollective = await this.animationCollectiveRepository.get(
      command.idAnimationCollective
    )

    if (!animationCollective) {
      return failure(
        new NonTrouveError(
          'Animation Collective',
          command.idAnimationCollective
        )
      )
    }

    const result = this.animationCollectiveService.cloturer(
      animationCollective,
      command.idsJeunes
    )

    if (isFailure(result)) {
      return result
    }

    await this.animationCollectiveRepository.save(result.data)

    return emptySuccess()
  }

  async authorize(
    command: CloturerAnimationCollectiveCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.rendezVousAuthorizer.authorize(
      command.idAnimationCollective,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
