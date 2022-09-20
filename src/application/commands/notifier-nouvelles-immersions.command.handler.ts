import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'
import {
  Recherche,
  RecherchesRepositoryToken
} from '../../domain/offre/recherche/recherche'
import { DateService } from '../../utils/date-service'
import { GetOffresImmersionQuery } from '../queries/get-offres-immersion.query.handler'

export interface NotifierNouvellesImmersionsCommand extends Command {
  immersions: Array<{
    location?: {
      lat: number
      lon: number
    }
    rome: string
    siret: string
  }>
}

const LIMITE_PAGINATION = 100

@Injectable()
export class NotifierNouvellesImmersionsCommandHandler extends CommandHandler<
  NotifierNouvellesImmersionsCommand,
  Stats
> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private recherchesRepository: Recherche.Repository,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private notificationService: Notification.Service,
    private dateService: DateService
  ) {
    super('NotifierNouvellesImmersionsHandler')
  }

  async handle(
    command: NotifierNouvellesImmersionsCommand
  ): Promise<Result<Stats>> {
    const stats: Stats = {
      nombreDeNouvellesOffres: command.immersions.length,
      erreurs: 0,
      recherchesCorrespondantes: 0
    }
    const debut = this.dateService.now()

    for (const immersion of command.immersions) {
      if (immersion.location) {
        const query: GetOffresImmersionQuery = {
          rome: immersion.rome,
          lat: immersion.location.lat,
          lon: immersion.location.lon
        }

        let toutesLesRecherchesOntEteAnalysees = false
        let offset = 0

        while (!toutesLesRecherchesOntEteAnalysees) {
          const recherches =
            await this.recherchesRepository.trouverLesRecherchesImmersions(
              query,
              LIMITE_PAGINATION,
              offset
            )

          if (recherches.length < LIMITE_PAGINATION) {
            toutesLesRecherchesOntEteAnalysees = true
          }

          if (recherches.length) {
            stats.recherchesCorrespondantes =
              stats.recherchesCorrespondantes + recherches.length
            const promises = await Promise.allSettled(
              recherches.map(this.notifier.bind(this))
            )

            promises.forEach(promise => {
              if (promise.status === 'rejected') {
                stats.erreurs++
                this.logger.error(promise.reason)
              }
            })
          }

          offset += LIMITE_PAGINATION
        }
      }
    }

    stats.tempsDExecution = debut.diffNow().milliseconds * -1

    return success(stats)
  }

  async notifier(recherche: Recherche): Promise<void> {
    const configuration =
      await this.jeuneConfigurationApplicationRepository.get(recherche.idJeune)
    await this.notificationService.notifierNouvellesOffres(
      recherche,
      configuration
    )
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  nombreDeNouvellesOffres: number
  recherchesCorrespondantes: number
  erreurs: number
  tempsDExecution?: number
}
