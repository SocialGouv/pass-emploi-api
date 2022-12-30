import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import { Planificateur } from '../../../domain/planificateur'
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

@Injectable()
export class HandleJobTraiterEvenementMiloHandler extends JobHandler<
  Planificateur.Job<unknown>
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
    private rendezVousMiloFactory: MiloRendezVous.Factory
  ) {
    super(Planificateur.JobType.TRAITER_EVENEMENT_MILO, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo>
  ): Promise<SuiviJob> {
    const debut = this.dateService.now()

    if (job.contenu.type === MiloRendezVous.TypeEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(debut, Traitement.TYPE_NON_TRAITABLE)
    }

    if (job.contenu.objet === MiloRendezVous.ObjetEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(debut, Traitement.OBJET_NON_TRAITABLE)
    }

    const jeune = await this.jeuneRepository.getByIdPartenaire(
      job.contenu.idPartenaireBeneficiaire,
      { avecConfiguration: true }
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

    if (!rendezVousMilo) {
      if (rendezVousExistant) {
        await this.rendezVousRepository.delete(rendezVousExistant.id)
        return this.buildSuiviJob(debut, Traitement.RENDEZ_VOUS_SUPPRIME)
      } else {
        return this.buildSuiviJob(debut, Traitement.RENDEZ_VOUS_INEXISTANT)
      }
    }

    if (rendezVousExistant) {
      const rendezVousMisAJour =
        this.rendezVousMiloFactory.mettreAJourRendezVousPassEmploi(
          rendezVousExistant,
          rendezVousMilo
        )
      await this.rendezVousRepository.save(rendezVousMisAJour)
      return this.buildSuiviJob(debut, Traitement.RENDEZ_VOUS_MODIFIE)
    } else {
      const nouveauRendezVous =
        this.rendezVousMiloFactory.creerRendezVousPassEmploi(
          rendezVousMilo,
          jeune
        )
      await this.rendezVousRepository.save(nouveauRendezVous)
      return this.buildSuiviJob(debut, Traitement.RENDEZ_VOUS_AJOUTE)
    }
  }

  private buildSuiviJob(debut: DateTime, traitement: Traitement): SuiviJob {
    return {
      jobType: this.jobType,
      dateExecution: debut,
      resultat: {
        traitement
      },
      succes: true,
      nbErreurs: 0,
      tempsExecution: DateService.calculerTempsExecution(debut)
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
