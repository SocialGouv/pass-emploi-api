import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { Job } from '../../../building-blocks/types/job'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { isFailure } from '../../../building-blocks/types/result'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import {
  Recherche,
  RecherchesRepositoryToken
} from '../../../domain/offre/recherche/recherche'
import { Planificateur } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { FindAllOffresServicesCiviqueQueryGetter } from '../../queries/query-getters/find-all-offres-services-civique.query.getter'

export type HandleJobNotifierNouveauxServicesCiviqueCommand = Command

const PAGINATION_NOMBRE_DE_RECHERCHES_MAXIMUM = 100
const PAGINATION_NOMBRE_D_OFFRES_MAXIMUM = 1000

@Injectable()
export class HandleJobNotifierNouveauxServicesCiviqueCommandHandler extends JobHandler<Job> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private notificationService: Notification.Service,
    private findAllOffresServicesCiviqueQueryGetter: FindAllOffresServicesCiviqueQueryGetter,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(
      Planificateur.JobType.NOUVELLES_OFFRES_SERVICE_CIVIQUE,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    const stats = {
      nombreDeNouvellesOffres: 0,
      recherchesCorrespondantes: 0
    }
    const maintenant = this.dateService.now()
    const suivi: SuiviJob = {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: false,
      dateExecution: maintenant,
      tempsExecution: 0,
      resultat: {}
    }

    // On récupère les nouvelles offres depuis hier en considérant que le job tourne une fois par jour
    const hier = maintenant.minus({ day: 1 })
    const result = await this.findAllOffresServicesCiviqueQueryGetter.handle({
      page: 1,
      limit: PAGINATION_NOMBRE_D_OFFRES_MAXIMUM,
      dateDeCreationMinimum: hier.toISO()
    })

    if (isFailure(result)) {
      return { ...suivi, resultat: result.error }
    }

    stats.nombreDeNouvellesOffres = result.data.results.length

    for (const offre of result.data.results) {
      let toutesLesRecherchesOntEteAnalysees = false
      let offset = 0

      if (!offre.localisation) {
        this.logger.warn(`L'offre ${offre.id} n'a pas de localisation`)
        continue
      }

      while (!toutesLesRecherchesOntEteAnalysees) {
        const depuisMinuit = maintenant.set({ hour: 0, minute: 0, second: 0 })
        const criteres: Recherche.ServiceCivique = {
          domaine: offre.domaine,
          lat: offre.localisation.latitude,
          lon: offre.localisation.longitude,
          dateDeDebutMinimum: offre.dateDeDebut
        }
        const recherches =
          await this.rechercheRepository.trouverLesRecherchesServicesCiviques(
            criteres,
            PAGINATION_NOMBRE_DE_RECHERCHES_MAXIMUM,
            offset,
            depuisMinuit
          )

        if (recherches.length < PAGINATION_NOMBRE_DE_RECHERCHES_MAXIMUM) {
          toutesLesRecherchesOntEteAnalysees = true
        }

        if (recherches.length) {
          stats.recherchesCorrespondantes += recherches.length
          const promises = await Promise.allSettled(
            recherches.map((recherche: Recherche) =>
              this.notifierEtMettreAJourLaDateDeRecherche(recherche, maintenant)
            )
          )

          promises.forEach(promise => {
            if (promise.status === 'rejected') {
              suivi.nbErreurs++
              this.logger.error(promise.reason)
            }
          })
        }

        offset += PAGINATION_NOMBRE_DE_RECHERCHES_MAXIMUM
      }
    }

    return {
      ...suivi,
      succes: true,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }

  async notifierEtMettreAJourLaDateDeRecherche(
    recherche: Recherche,
    date: DateTime
  ): Promise<void> {
    const configuration =
      await this.jeuneConfigurationApplicationRepository.get(recherche.idJeune)

    await this.rechercheRepository.update({
      ...recherche,
      dateDerniereRecherche: date,
      etat: Recherche.Etat.SUCCES
    })

    await this.notificationService.notifierNouvellesOffres(
      recherche,
      configuration
    )
  }
}
