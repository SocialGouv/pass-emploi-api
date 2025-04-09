import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { DateService } from '../../utils/date-service'
import { CodeTypeRendezVous, RendezVous } from './rendez-vous'

export const AnimationCollectiveRepositoryToken =
  'AnimationCollective.Repository'

export interface AnimationCollective extends RendezVous {
  type: CodeTypeRendezVous.ATELIER | CodeTypeRendezVous.INFORMATION_COLLECTIVE
}

export namespace AnimationCollective {
  export enum Statut {
    A_VENIR = 'A_VENIR',
    A_CLOTURER = 'A_CLOTURER',
    CLOTUREE = 'CLOTUREE'
  }

  export function estCloturee(rendezVous: RendezVous): boolean {
    return Boolean(
      RendezVous.estUnTypeAnimationCollective(rendezVous.type) &&
        rendezVous.dateCloture
    )
  }

  export interface Repository {
    get(idAnimationCollective: string): Promise<AnimationCollective | undefined>

    getAllAVenirByEtablissement(
      idEtablissement: string
    ): Promise<AnimationCollective[]>

    getAllByEtablissementAvecSupprimes(
      idEtablissement: string
    ): Promise<AnimationCollective[]>

    save(animationCollective: AnimationCollective): Promise<void>
  }

  @Injectable()
  export class Service {
    constructor(
      @Inject(AnimationCollectiveRepositoryToken)
      private repository: Repository,
      private dateService: DateService
    ) {}

    async desinscrireJeunesDesAnimationsCollectivesDUnEtablissement(
      idsJeunes: string[],
      idAgence: string
    ): Promise<void> {
      const animationsCollectives =
        await this.repository.getAllByEtablissementAvecSupprimes(idAgence)

      for (const animationCollective of animationsCollectives) {
        await this.desinscrireJeunesDeLAnimationCollective(
          animationCollective,
          idsJeunes
        )
      }
    }

    async desinscrireJeunesDeLAnimationCollective(
      animationCollective: AnimationCollective,
      idsJeunes: string[]
    ): Promise<void> {
      const updatedAnimationCollective = {
        ...animationCollective,
        jeunes: animationCollective.jeunes.filter(
          jeune => !idsJeunes.includes(jeune.id)
        )
      }
      await this.repository.save(updatedAnimationCollective)
    }

    async updateEtablissement(
      animationCollective: AnimationCollective,
      idEtablissement: string
    ): Promise<void> {
      const animationCollectiveMiseAJour: AnimationCollective = {
        ...animationCollective,
        idAgence: idEtablissement
      }
      await this.repository.save(animationCollectiveMiseAJour)
    }

    cloturer(
      animationCollective: AnimationCollective,
      idsJeunesPresents: string[]
    ): Result<AnimationCollective> {
      if (this.estAVenir(animationCollective)) {
        return failure(
          new MauvaiseCommandeError(
            "L'animation collective n'est pas encore passée."
          )
        )
      }

      if (AnimationCollective.estCloturee(animationCollective)) {
        return failure(
          new MauvaiseCommandeError('Animation Collective déjà cloturée.')
        )
      }

      const maintenant = this.dateService.now()

      const jeunesAvecPresence = animationCollective.jeunes.map(jeune => {
        return { ...jeune, present: idsJeunesPresents.includes(jeune.id) }
      })

      return success({
        ...animationCollective,
        jeunes: jeunesAvecPresence,
        dateCloture: maintenant
      })
    }

    private estAVenir(animationCollective: AnimationCollective): boolean {
      const maintenant = this.dateService.now()

      return Boolean(maintenant < DateTime.fromJSDate(animationCollective.date))
    }
  }
}
