import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import {
  Milo,
  MiloRendezVousFactory,
  PartenaireMiloRepositoryToken
} from '../../../domain/partenaire/milo'
import { Planificateur } from '../../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous/rendez-vous'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { DateTime } from 'luxon'

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
    @Inject(PartenaireMiloRepositoryToken)
    private miloEvenementsHttpRepository: Milo.Repository,
    private rendezVousMiloFactory: MiloRendezVousFactory
  ) {
    super(Planificateur.JobType.TRAITER_EVENEMENT_MILO, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo>
  ): Promise<SuiviJob> {
    const debut = this.dateService.now()

    if (job.contenu.type === Milo.TypeEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(debut, Traitement.TYPE_NON_TRAITABLE, true)
    }

    if (job.contenu.objet === Milo.ObjetEvenement.NON_TRAITABLE) {
      return this.buildSuiviJob(debut, Traitement.OBJET_NON_TRAITABLE, true)
    }

    const jeune = await this.jeuneRepository.getByIdPartenaire(
      job.contenu.idPartenaireBeneficiaire,
      { avecConfiguration: true }
    )

    if (jeune === undefined) {
      return this.buildSuiviJob(debut, Traitement.JEUNE_INEXISTANT, true)
    }

    const rendezVousMilo =
      await this.miloEvenementsHttpRepository.findRendezVousByEvenement(
        job.contenu
      )

    if (rendezVousMilo === undefined) {
      return this.buildSuiviJob(debut, Traitement.RENDEZ_VOUS_INEXISTANT, true)
    }

    const rendezVousExistant =
      await this.rendezVousRepository.getByIdPartenaire(
        rendezVousMilo.id,
        rendezVousMilo.type
      )

    if (!rendezVousExistant) {
      const unNouveauRendezVous =
        this.rendezVousMiloFactory.creerRendezVousPassEmploi(
          rendezVousMilo,
          jeune
        )

      await this.rendezVousRepository.save(unNouveauRendezVous)
    } else {
      const unRendezVousMisAJour =
        await this.rendezVousMiloFactory.mettreAJourRendezVousPassEmploi(
          rendezVousExistant,
          rendezVousMilo
        )
      await this.rendezVousRepository.save(unRendezVousMisAJour)
    }
    return this.buildSuiviJob(debut, Traitement.OK, true)
  }

  private buildSuiviJob(
    debut: DateTime,
    traitement: Traitement,
    succes: boolean
  ): SuiviJob {
    return {
      jobType: this.jobType,
      dateExecution: debut,
      resultat: {
        traitement
      },
      succes: succes,
      nbErreurs: 0,
      tempsExecution: DateService.calculerTempsExecution(debut)
    }
  }
}

export enum Traitement {
  OK = 'OK',
  RENDEZ_VOUS_INEXISTANT = 'RENDEZ_VOUS_INEXISTANT',
  JEUNE_INEXISTANT = 'JEUNE_INEXISTANT',
  TYPE_NON_TRAITABLE = 'TYPE_NON_TRAITABLE',
  OBJET_NON_TRAITABLE = 'OBJET_NON_TRAITABLE'
}
