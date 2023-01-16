import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import {
  Planificateur,
  PlanificateurService,
  ProcessJobType
} from '../../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous/rendez-vous'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { DateTime } from 'luxon'
import {
  MiloRendezVous,
  MiloRendezVousRepositoryToken
} from '../../../domain/partenaire/milo/milo.rendez-vous'
import { Notification } from '../../../domain/notification/notification'
import { buildError } from '../../../utils/logger.module'
import { ConfigService } from '@nestjs/config'

@Injectable()
@ProcessJobType(Planificateur.JobType.TRAITER_EVENEMENT_MILO)
export class HandleJobTraiterEvenementMiloHandler extends JobHandler<
  Planificateur.Job<Planificateur.JobTraiterEvenementMilo>
> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(MiloRendezVousRepositoryToken)
    private miloRendezVousHttpRepository: MiloRendezVous.Repository,
    private rendezVousMiloFactory: MiloRendezVous.Factory,
    private notificationService: Notification.Service,
    private planificateurService: PlanificateurService,
    private configuration: ConfigService
  ) {
    super(Planificateur.JobType.TRAITER_EVENEMENT_MILO, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo>
  ): Promise<SuiviJob> {
    const debut = this.dateService.now()
    const doitNotifier = this.configuration.get(
      'features.notifierRendezVousMilo'
    )

    if (job.contenu.type === MiloRendezVous.TypeEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(debut, Traitement.TYPE_NON_TRAITABLE)
    }

    if (job.contenu.objet === MiloRendezVous.ObjetEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(debut, Traitement.OBJET_NON_TRAITABLE)
    }

    const jeune = await this.jeuneRepository.getByIdPartenaire(
      job.contenu.idPartenaireBeneficiaire
    )

    if (jeune === undefined) {
      return this.buildSuiviJob(debut, Traitement.JEUNE_INEXISTANT)
    }

    const rendezVousMilo =
      await this.miloRendezVousHttpRepository.findRendezVousByEvenement(
        job.contenu
      )

    const rendezVousExistant =
      await this.rendezVousRepository.getByIdPartenaire(
        job.contenu.idObjet,
        job.contenu.objet
      )

    if (
      !rendezVousMilo ||
      job.contenu.type === MiloRendezVous.TypeEvenement.DELETE
    ) {
      if (rendezVousExistant) {
        await this.rendezVousRepository.delete(rendezVousExistant.id)
        if (doitNotifier) {
          this.notificationService.notifierLesJeunesDuRdv(
            rendezVousExistant,
            Notification.Type.DELETED_RENDEZVOUS
          )
        }
        this.supprimerLesRappelsDeRendezVous(rendezVousExistant)
        return this.buildSuiviJob(
          debut,
          Traitement.RENDEZ_VOUS_SUPPRIME,
          jeune.id,
          rendezVousExistant.id
        )
      } else {
        return this.buildSuiviJob(
          debut,
          Traitement.RENDEZ_VOUS_INEXISTANT,
          jeune.id
        )
      }
    }

    if (rendezVousExistant) {
      const rendezVousMisAJour =
        this.rendezVousMiloFactory.mettreAJourRendezVousPassEmploi(
          rendezVousExistant,
          rendezVousMilo
        )
      await this.rendezVousRepository.save(rendezVousMisAJour)
      if (doitNotifier) {
        this.notificationService.notifierLesJeunesDuRdv(
          rendezVousMisAJour,
          Notification.Type.UPDATED_RENDEZVOUS
        )
      }
      this.replanifierLesRappelsDeRendezVous(
        rendezVousMisAJour,
        rendezVousExistant
      )
      return this.buildSuiviJob(
        debut,
        Traitement.RENDEZ_VOUS_MODIFIE,
        jeune.id,
        rendezVousExistant.id
      )
    } else {
      const nouveauRendezVous =
        this.rendezVousMiloFactory.creerRendezVousPassEmploi(
          rendezVousMilo,
          jeune
        )
      await this.rendezVousRepository.save(nouveauRendezVous)
      if (doitNotifier) {
        this.notificationService.notifierLesJeunesDuRdv(
          nouveauRendezVous,
          Notification.Type.NEW_RENDEZVOUS
        )
      }
      this.planifierLesRappelsDeRendezVous(nouveauRendezVous)
      return this.buildSuiviJob(
        debut,
        Traitement.RENDEZ_VOUS_AJOUTE,
        jeune.id,
        nouveauRendezVous.id
      )
    }
  }

  private buildSuiviJob(
    debut: DateTime,
    traitement: Traitement,
    idJeune?: string,
    idRendezVous?: string
  ): SuiviJob {
    return {
      jobType: this.jobType,
      dateExecution: debut,
      resultat: {
        traitement,
        idJeune,
        idRendezVous
      },
      succes: true,
      nbErreurs: 0,
      tempsExecution: DateService.calculerTempsExecution(debut)
    }
  }

  private async planifierLesRappelsDeRendezVous(
    rendezVous: RendezVous
  ): Promise<void> {
    try {
      await this.planificateurService.planifierRappelsRendezVous(rendezVous)
    } catch (e) {
      this.logger.error(
        buildError(
          `La planification des notifications du rendez-vous ${rendezVous.id} a échoué`,
          e
        )
      )
      this.apmService.captureError(e)
    }
  }

  private async replanifierLesRappelsDeRendezVous(
    rendezVousUpdated: RendezVous,
    rendezVous: RendezVous
  ): Promise<void> {
    const laDateAEteModifiee =
      rendezVousUpdated.date.getTime() !== rendezVous.date.getTime()
    if (laDateAEteModifiee) {
      try {
        await this.planificateurService.supprimerRappelsParId(
          rendezVousUpdated.id
        )
        await this.planificateurService.planifierRappelsRendezVous(
          rendezVousUpdated
        )
      } catch (e) {
        this.logger.error(
          buildError(
            `La replanification des notifications du rendez-vous ${rendezVousUpdated.id} a échoué`,
            e
          )
        )
        this.apmService.captureError(e)
      }
    }
  }

  private async supprimerLesRappelsDeRendezVous(
    rendezVous: RendezVous
  ): Promise<void> {
    try {
      await this.planificateurService.supprimerRappelsParId(rendezVous.id)
    } catch (e) {
      this.logger.error(
        buildError(
          `La suppression des notifications du rendez-vous ${rendezVous.id} a échoué`,
          e
        )
      )
      this.apmService.captureError(e)
    }
  }
}

export enum Traitement {
  RENDEZ_VOUS_SUPPRIME = 'RENDEZ_VOUS_SUPPRIME',
  RENDEZ_VOUS_AJOUTE = 'RENDEZ_VOUS_AJOUTE',
  RENDEZ_VOUS_MODIFIE = 'RENDEZ_VOUS_MODIFIE',
  RENDEZ_VOUS_INEXISTANT = 'RENDEZ_VOUS_INEXISTANT',
  JEUNE_INEXISTANT = 'JEUNE_INEXISTANT',
  TYPE_NON_TRAITABLE = 'TYPE_NON_TRAITABLE',
  OBJET_NON_TRAITABLE = 'OBJET_NON_TRAITABLE'
}
