import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
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
    private animationCollectiveFactory: RendezVous.AnimationCollective.Factory,
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

    if (this.animationCollectiveService.estAVenir(animationCollective)) {
      return failure(new MauvaiseCommandeError('Animation Collective à venir.'))
    }

    if (RendezVous.AnimationCollective.estCloturee(animationCollective)) {
      return failure(
        new MauvaiseCommandeError('Animation Collective déjà cloturée.')
      )
    }

    const animationCollectiveCloturee =
      this.animationCollectiveFactory.cloturer(
        animationCollective,
        command.idsJeunes
      )

    await this.animationCollectiveRepository.save(animationCollectiveCloturee)

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
