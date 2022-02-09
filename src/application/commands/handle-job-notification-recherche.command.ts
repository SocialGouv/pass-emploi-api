import { Inject, Injectable } from '@nestjs/common'
import {
  emptySuccess,
  isFailure,
  isSuccess,
  Result
} from 'src/building-blocks/types/result'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from 'src/domain/offre-emploi'
import { Recherche, RecherchesRepositoryToken } from 'src/domain/recherche'
import { DateService } from 'src/utils/date-service'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { OffresEmploiQueryModel } from '../queries/query-models/offres-emploi.query-models'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { GetOffresEmploiQuery } from '../queries/get-offres-emploi.query.handler'
import { Command } from '../../building-blocks/types/command'

@Injectable()
export class NotifierNouvellesOffresEmploiCommandHandler extends CommandHandler<
  Command,
  void
> {
  constructor(
    private dateService: DateService,
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {
    super('NotifierNouvellesOffresEmploiCommandHandler')
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<Result> {
    const maintenant = this.dateService.nowJs()
    const nombreRecherches = 5
    let compteurDEchecs = 0

    while (true) {
      const recherches = await this.rechercheRepository.findAvantDate(
        [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
        nombreRecherches,
        maintenant
      )
      if (!recherches.length) {
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

          if (resultat.value.data.results.length) {
            const jeune = await this.jeuneRepository.get(recherche.idJeune)

            if (jeune?.pushNotificationToken) {
              const notification = Notification.createNouvelleOffreEmploi(
                jeune.pushNotificationToken,
                recherche.id
              )
              this.notificationRepository.send(notification)
            }
          }
        }

        await this.rechercheRepository.saveRecherche({
          ...recherches[i],
          dateDerniereRecherche: maintenant,
          etat: etatRecherche
        })

        if (
          (resultat.status === 'fulfilled' && isFailure(resultat.value)) ||
          resultat.status === 'rejected'
        ) {
          compteurDEchecs++
          if (compteurDEchecs > 100) {
            this.logger.error("Trop d'échecs dans le job")
            break
          }
        }

        if (
          resultat.status === 'fulfilled' &&
          isFailure(resultat.value) &&
          (resultat.value.error as ErreurHttp).statusCode === 429
        ) {
          ilYAeuUne429 = true
        }
      }
      if (ilYAeuUne429) {
        await new Promise(resolve => setTimeout(resolve, 10000))
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return emptySuccess()
  }

  private async recupererLesNouvellesOffres(
    recherche: Recherche
  ): Promise<Result<OffresEmploiQueryModel>> {
    const criteres = recherche.criteres as GetOffresEmploiQuery | undefined

    const MIN_RESULTATS_OFFRES_PAGE = 1
    const MIN_RESULTATS_OFFRES_LIMIT = 1

    return this.offresEmploiRepository.findAll(
      MIN_RESULTATS_OFFRES_PAGE,
      MIN_RESULTATS_OFFRES_LIMIT,
      criteres?.alternance,
      criteres?.query,
      criteres?.departement,
      criteres?.experience,
      criteres?.duree,
      criteres?.contrat,
      criteres?.rayon,
      criteres?.commune,
      recherche.dateDerniereRecherche
    )
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
