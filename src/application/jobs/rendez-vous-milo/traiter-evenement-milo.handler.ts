import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import {
  Planificateur,
  PlanificateurService,
  ProcessJobType
} from '../../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous/rendez-vous'
import {
  MiloRendezVousRepositoryToken,
  RendezVousMilo
} from '../../../domain/rendez-vous/rendez-vous.milo'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { buildError } from '../../../utils/logger.module'

@Injectable()
@ProcessJobType(Planificateur.JobType.TRAITER_EVENEMENT_MILO)
export class TraiterEvenementMiloJobHandler extends JobHandler<
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
    private miloRendezVousHttpRepository: RendezVousMilo.Repository,
    private rendezVousMiloFactory: RendezVousMilo.Factory,
    private notificationService: Notification.Service,
    private planificateurService: PlanificateurService,
    private configuration: ConfigService
  ) {
    super(Planificateur.JobType.TRAITER_EVENEMENT_MILO, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo>
  ): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    const FT_NOTIFIER_RDV_MILO = this.configuration.get(
      'features.notifierRendezVousMilo'
    )

    const evenement: RendezVousMilo.Evenement = job.contenu

    if (evenement.type === RendezVousMilo.TypeEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(maintenant, Traitement.TYPE_NON_TRAITABLE)
    }
    if (evenement.objet === RendezVousMilo.ObjetEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(maintenant, Traitement.OBJET_NON_TRAITABLE)
    }

    const jeune = await this.jeuneRepository.getByIdPartenaire(
      evenement.idPartenaireBeneficiaire
    )
    if (!jeune) {
      return this.buildSuiviJob(maintenant, Traitement.JEUNE_INEXISTANT)
    }

    const rendezVousMILO =
      await this.miloRendezVousHttpRepository.findRendezVousByEvenement(
        evenement
      )
    const rendezVousCEJExistant =
      await this.rendezVousRepository.getByIdPartenaire(
        evenement.idObjet,
        evenement.objet
      )

    switch (evenement.type) {
      case RendezVousMilo.TypeEvenement.CREATE:
        return this.createRendezVousMILO(
          jeune,
          maintenant,
          rendezVousMILO,
          FT_NOTIFIER_RDV_MILO
        )
      case RendezVousMilo.TypeEvenement.UPDATE:
        return this.updateRendezVousMILO(
          jeune,
          maintenant,
          rendezVousMILO,
          rendezVousCEJExistant,
          FT_NOTIFIER_RDV_MILO
        )
      case RendezVousMilo.TypeEvenement.DELETE:
        return this.deleteRendezVousMILO(
          jeune,
          maintenant,
          rendezVousMILO,
          rendezVousCEJExistant,
          FT_NOTIFIER_RDV_MILO
        )
    }
  }

  private async createRendezVousMILO(
    jeune: Jeune,
    maintenant: DateTime,
    rendezVousMILO?: RendezVousMilo,
    FT_NOTIFIER_RDV_MILO?: boolean
  ): Promise<SuiviJob> {
    if (rendezVousMILO && this.isStatutRecuperable(rendezVousMILO)) {
      const newRendezVousCEJ = this.rendezVousMiloFactory.createRendezVousCEJ(
        rendezVousMILO,
        jeune
      )

      await this.rendezVousRepository.save(newRendezVousCEJ)
      this.planifierLesRappelsDeRendezVous(newRendezVousCEJ)

      this.notifier(
        rendezVousMILO,
        newRendezVousCEJ,
        maintenant,
        Notification.Type.NEW_RENDEZVOUS,
        FT_NOTIFIER_RDV_MILO
      )
      return this.buildSuiviJob(
        maintenant,
        Traitement.RENDEZ_VOUS_AJOUTE,
        jeune.id,
        newRendezVousCEJ.id
      )
    }
    return this.buildSuiviJob(
      maintenant,
      Traitement.TRAITEMENT_CREATE_INCONNU,
      jeune.id
    )
  }

  private async updateRendezVousMILO(
    jeune: Jeune,
    maintenant: DateTime,
    rendezVousMILO?: RendezVousMilo,
    rendezVousCEJExistant?: RendezVous,
    FT_NOTIFIER_RDV_MILO?: boolean
  ): Promise<SuiviJob> {
    if (rendezVousMILO) {
      if (rendezVousCEJExistant) {
        if (!this.isStatutRecuperable(rendezVousMILO)) {
          return this.deleteRendezVousMILO(
            jeune,
            maintenant,
            rendezVousMILO,
            rendezVousCEJExistant,
            FT_NOTIFIER_RDV_MILO
          )
        }

        const rendezVousCEJUpdated =
          this.rendezVousMiloFactory.updateRendezVousCEJ(
            rendezVousCEJExistant,
            rendezVousMILO
          )
        await this.rendezVousRepository.save(rendezVousCEJUpdated)
        this.replanifierLesRappelsDeRendezVous(
          rendezVousCEJUpdated,
          rendezVousCEJExistant
        )

        this.notifier(
          rendezVousMILO,
          rendezVousCEJUpdated,
          maintenant,
          Notification.Type.UPDATED_RENDEZVOUS,
          FT_NOTIFIER_RDV_MILO
        )
        return this.buildSuiviJob(
          maintenant,
          Traitement.RENDEZ_VOUS_MODIFIE,
          jeune.id,
          rendezVousCEJExistant.id
        )
      } else {
        return this.createRendezVousMILO(
          jeune,
          maintenant,
          rendezVousMILO,
          FT_NOTIFIER_RDV_MILO
        )
      }
    }
    return this.buildSuiviJob(
      maintenant,
      Traitement.TRAITEMENT_UPDATE_INCONNU,
      jeune.id
    )
  }

  private async deleteRendezVousMILO(
    jeune: Jeune,
    maintenant: DateTime,
    rendezVousMILO?: RendezVousMilo,
    rendezVousCEJExistant?: RendezVous,
    FT_NOTIFIER_RDV_MILO?: boolean
  ): Promise<SuiviJob> {
    if (rendezVousCEJExistant) {
      await this.rendezVousRepository.delete(rendezVousCEJExistant.id)
      this.supprimerLesRappelsDeRendezVous(rendezVousCEJExistant)

      if (rendezVousMILO) {
        this.notifier(
          rendezVousMILO,
          rendezVousCEJExistant,
          maintenant,
          Notification.Type.DELETED_RENDEZVOUS,
          FT_NOTIFIER_RDV_MILO
        )
      }

      return this.buildSuiviJob(
        maintenant,
        Traitement.RENDEZ_VOUS_SUPPRIME,
        jeune.id,
        rendezVousCEJExistant.id
      )
    }
    return this.buildSuiviJob(
      maintenant,
      Traitement.TRAITEMENT_DELETE_INCONNU,
      jeune.id
    )
  }

  private notifier(
    rendezVousMILO: RendezVousMilo,
    rendezVousCEJ: RendezVous,
    maintenant: DateTime,
    typeNotification: Notification.TypeRdv,
    FT_NOTIFIER_RDV_MILO?: boolean
  ): void {
    if (FT_NOTIFIER_RDV_MILO) {
      const estRDVFutur = DateService.isGreater(
        DateService.fromJSDateToDateTime(rendezVousCEJ.date)!,
        maintenant
      )

      if (estRDVFutur && this.isStatutNotifiable(rendezVousMILO)) {
        this.notificationService.notifierLesJeunesDuRdv(
          rendezVousCEJ,
          typeNotification
        )
      }
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

  private isStatutRecuperable(rendezVousMILO: RendezVousMilo): boolean {
    return ![
      RendezVousMilo.Statut.RDV_ANNULE,
      RendezVousMilo.Statut.RDV_REPORTE,
      RendezVousMilo.Statut.SESSION_REFUS_JEUNE,
      RendezVousMilo.Statut.SESSION_REFUS_TIERS
    ].includes(rendezVousMILO.statut as RendezVousMilo.Statut)
  }

  private isStatutNotifiable(rendezVousMILO: RendezVousMilo): boolean {
    return [
      RendezVousMilo.Statut.RDV_ABSENT,
      RendezVousMilo.Statut.RDV_NON_PRECISE,
      RendezVousMilo.Statut.RDV_PLANIFIE,
      RendezVousMilo.Statut.RDV_PRESENT,
      RendezVousMilo.Statut.SESSION_PRESCRIT
    ].includes(rendezVousMILO.statut as RendezVousMilo.Statut)
  }
}

export enum Traitement {
  RENDEZ_VOUS_SUPPRIME = 'RENDEZ_VOUS_SUPPRIME',
  RENDEZ_VOUS_AJOUTE = 'RENDEZ_VOUS_AJOUTE',
  RENDEZ_VOUS_MODIFIE = 'RENDEZ_VOUS_MODIFIE',
  RENDEZ_VOUS_INEXISTANT = 'RENDEZ_VOUS_INEXISTANT',
  JEUNE_INEXISTANT = 'JEUNE_INEXISTANT',
  TYPE_NON_TRAITABLE = 'TYPE_NON_TRAITABLE',
  OBJET_NON_TRAITABLE = 'OBJET_NON_TRAITABLE',
  TRAITEMENT_CREATE_INCONNU = 'TRAITEMENT_CREATE_INCONNU',
  TRAITEMENT_UPDATE_INCONNU = 'TRAITEMENT_UPDATE_INCONNU',
  TRAITEMENT_DELETE_INCONNU = 'TRAITEMENT_DELETE_INCONNU'
}
