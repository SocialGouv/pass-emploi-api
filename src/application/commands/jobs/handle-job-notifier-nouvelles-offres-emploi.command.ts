import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  emptySuccess,
  failure,
  isFailure,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import { OffresEmploi } from 'src/domain/offre-emploi'
import { Recherche, RecherchesRepositoryToken } from 'src/domain/recherche'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import { GetOffresEmploiQuery } from '../../queries/get-offres-emploi.query.handler'
import { OffresEmploiQueryModel } from '../../queries/query-models/offres-emploi.query-model'
import { FindAllOffresEmploiQueryGetter } from '../../queries/query-getters/find-all-offres-emploi.query.getter'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from 'src/domain/notification-support'

@Injectable()
export class HandleJobNotifierNouvellesOffresEmploiCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    private dateService: DateService,
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    private findAllOffresEmploiQueryGetter: FindAllOffresEmploiQueryGetter,
    private notificationService: Notification.Service,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private configuration: ConfigService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service
  ) {
    super(
      'HandleJobNotifierNouvellesOffresEmploiCommandHandler',
      notificationSupportService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const maintenant = this.dateService.now()
    const nombreRecherches = parseInt(
      this.configuration.get(
        'jobs.notificationRecherches.nombreDeRequetesEnParallele'
      )!
    )
    const stats: Stats = {
      nombreDeRecherchesTotal: 0,
      succes: 0,
      notificationsEnvoyees: 0,
      429: 0,
      echecs: 0
    }

    try {
      while (true) {
        const recherches = await this.rechercheRepository.findAvantDate(
          [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
          nombreRecherches,
          maintenant
        )

        const toutesLesRecherchesOntEteTraitees = !recherches.length
        if (toutesLesRecherchesOntEteTraitees) {
          break
        }

        const resultatsRecherches = await Promise.allSettled(
          recherches.map(this.recupererLesNouvellesOffres.bind(this))
        )

        let ilYAeuUne429 = false

        for (let i = 0; i < recherches.length; i++) {
          const resultat = resultatsRecherches[i]
          const recherche = recherches[i]
          let etatRecherche: Recherche.Etat = Recherche.Etat.ECHEC

          if (resultat.status === 'fulfilled' && isSuccess(resultat.value)) {
            etatRecherche = Recherche.Etat.SUCCES
            stats.succes = stats.succes + 1

            if (resultat.value.data.results.length) {
              const configuration =
                await this.jeuneConfigurationApplicationRepository.get(
                  recherche.idJeune
                )

              stats.notificationsEnvoyees = stats.notificationsEnvoyees + 1
              await this.notificationService.notifierNouvellesOffres(
                recherche,
                configuration
              )
            }
          }

          await this.rechercheRepository.update({
            ...recherches[i],
            dateDerniereRecherche: maintenant,
            etat: etatRecherche
          })

          // Quand il y a une erreur
          if (
            (resultat.status === 'fulfilled' && isFailure(resultat.value)) ||
            resultat.status === 'rejected'
          ) {
            stats.echecs = stats.echecs + 1
            if (stats.echecs > 100) {
              this.logger.error("Trop d'échecs dans le job")
              break
            }
          }

          // Quand il y a une 429
          if (
            resultat.status === 'fulfilled' &&
            isFailure(resultat.value) &&
            (resultat.value.error as ErreurHttp).statusCode === 429
          ) {
            stats['429'] = stats['429'] + 1
            ilYAeuUne429 = true
          }
        }
        if (ilYAeuUne429) {
          this.logger.warn('Une 429 est apparue, on attend 10 secondes')
          await new Promise(resolve => setTimeout(resolve, 10000))
        } else {
          this.logger.log('On attend 1 seconde')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      stats.tempsDExecution = maintenant.diffNow().milliseconds * -1
      stats.nombreDeRecherchesTotal = stats.succes + stats.echecs
      return success(stats)
    } catch (e) {
      this.logger.error("Le job de notifications s'est arrêté")
      this.logger.log(stats)
      return failure(e)
    }
  }

  private async recupererLesNouvellesOffres(
    recherche: Recherche
  ): Promise<Result<OffresEmploiQueryModel>> {
    const criteresBasiques = recherche.criteres as
      | GetOffresEmploiQuery
      | undefined
    const criteres: OffresEmploi.Criteres = {
      ...criteresBasiques,
      minDateCreation: recherche.dateDerniereRecherche,
      page: 1,
      limit: 2
    }

    return this.findAllOffresEmploiQueryGetter.handle(criteres)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  nombreDeRecherchesTotal: number
  succes: number
  echecs: number
  notificationsEnvoyees: number
  429: number
  tempsDExecution?: number
}
