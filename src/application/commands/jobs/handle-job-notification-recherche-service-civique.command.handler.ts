import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from 'src/domain/notification-support'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import { OffreServiceCivique } from '../../../domain/offre-service-civique'
import { Recherche, RecherchesRepositoryToken } from '../../../domain/recherche'
import { DateService } from '../../../utils/date-service'
import { GetServicesCiviqueQuery } from '../../queries/get-services-civique.query.handler'
import { FindAllOffresServicesCiviqueQueryGetter } from '../../queries/query-getters/find-all-offres-services-civique.query.getter'

export type HandleJobNotifierNouveauxServicesCiviqueCommand = Command

const PAGINATION_NOMBRE_DE_RECHERCHES_MAXIMUM = 100
const PAGINATION_NOMBRE_D_OFFRES_MAXIMUM = 1000

@Injectable()
export class HandleJobNotifierNouveauxServicesCiviqueCommandHandler extends CommandHandler<
  HandleJobNotifierNouveauxServicesCiviqueCommand,
  Stats
> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private notificationService: Notification.Service,
    private findAllOffresServicesCiviqueQueryGetter: FindAllOffresServicesCiviqueQueryGetter,
    private dateService: DateService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service
  ) {
    super(
      'HandleJobNotifierNouveauxServicesCiviqueCommandHandler',
      notificationSupportService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const stats: Stats = {
      nombreDeNouvellesOffres: 0,
      erreurs: 0,
      recherchesCorrespondantes: 0
    }
    const maintenant = this.dateService.now()

    // On récupère les nouvelles offres depuis hier en considérant que le job tourne une fois par jour
    const hier = maintenant.minus({ day: 1 })
    const result = await this.findAllOffresServicesCiviqueQueryGetter.handle({
      dateDeCreationMinimum: hier,
      page: 1,
      limit: PAGINATION_NOMBRE_D_OFFRES_MAXIMUM,
      editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
    })

    if (isFailure(result)) {
      return result
    }

    stats.nombreDeNouvellesOffres = result.data.length

    for (const offre of result.data) {
      let toutesLesRecherchesOntEteAnalysees = false
      let offset = 0

      if (!offre.localisation) {
        this.logger.warn(`L'offre ${offre.id} n'a pas de localisation`)
        continue
      }

      while (!toutesLesRecherchesOntEteAnalysees) {
        const criteres: GetServicesCiviqueQuery = {
          domaine: offre.domaine,
          lat: offre.localisation.latitude,
          lon: offre.localisation.longitude,
          dateDeDebutMinimum: offre.dateDeDebut
        }
        const depuisMinuit = maintenant.set({ hour: 0, minute: 0, second: 0 })
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
              stats.erreurs++
              this.logger.error(promise.reason)
            }
          })
        }

        offset += PAGINATION_NOMBRE_DE_RECHERCHES_MAXIMUM
      }
    }
    stats.tempsDExecution = maintenant.diffNow().milliseconds * -1

    return success(stats)
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

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

export interface Stats {
  nombreDeNouvellesOffres: number
  recherchesCorrespondantes: number
  erreurs: number
  tempsDExecution?: number
}
