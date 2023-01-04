import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { Job } from '../../../building-blocks/types/job'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import {
  isFailure,
  isSuccess,
  Result
} from '../../../building-blocks/types/result'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import { Offre } from '../../../domain/offre/offre'
import { RecherchesRepositoryToken } from '../../../domain/offre/recherche/recherche'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { GetOffresEmploiQuery } from '../../queries/get-offres-emploi.query.handler'
import { FindAllOffresEmploiQueryGetter } from '../../queries/query-getters/find-all-offres-emploi.query.getter'
import { OffresEmploiQueryModel } from '../../queries/query-models/offres-emploi.query-model'

@Injectable()
@ProcessJobType(Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI)
export class HandleJobNotifierNouvellesOffresEmploiCommandHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Offre.Recherche.Repository,
    private findAllOffresEmploiQueryGetter: FindAllOffresEmploiQueryGetter,
    private notificationService: Notification.Service,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private configuration: ConfigService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    const nombreRecherches = parseInt(
      this.configuration.get(
        'jobs.notificationRecherches.nombreDeRequetesEnParallele'
      )!
    )
    const stats: Stats = {
      nombreDeRecherchesTotal: 0,
      succes: 0,
      echecs: 0,
      notificationsEnvoyees: 0,
      429: 0
    }
    const suivi: SuiviJob = {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: false,
      dateExecution: maintenant,
      tempsExecution: 0,
      resultat: {}
    }

    try {
      while (true) {
        const recherches = await this.rechercheRepository.findAvantDate(
          [
            Offre.Recherche.Type.OFFRES_EMPLOI,
            Offre.Recherche.Type.OFFRES_ALTERNANCE
          ],
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
          let etatRecherche: Offre.Recherche.Etat = Offre.Recherche.Etat.ECHEC

          if (resultat.status === 'fulfilled' && isSuccess(resultat.value)) {
            etatRecherche = Offre.Recherche.Etat.SUCCES
            stats.succes++

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
      stats.nombreDeRecherchesTotal = stats.succes + stats.echecs
      return {
        ...suivi,
        nbErreurs: stats.echecs,
        succes: true,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        resultat: stats
      }
    } catch (e) {
      this.logger.error("Le job de notifications s'est arrêté")
      this.logger.log(stats)
      return {
        ...suivi,
        nbErreurs: stats.echecs,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        resultat: e
      }
    }
  }

  private async recupererLesNouvellesOffres(
    recherche: Offre.Recherche
  ): Promise<Result<OffresEmploiQueryModel>> {
    const criteresBasiques = recherche.criteres as
      | GetOffresEmploiQuery
      | undefined
    const criteres: GetOffresEmploiQuery = {
      ...criteresBasiques,
      minDateCreation: recherche.dateDerniereRecherche.toISO(),
      page: 1,
      limit: 2
    }

    return this.findAllOffresEmploiQueryGetter.handle(criteres)
  }
}

interface Stats {
  nombreDeRecherchesTotal: number
  succes: number
  echecs: number
  notificationsEnvoyees: number
  429: number
}
