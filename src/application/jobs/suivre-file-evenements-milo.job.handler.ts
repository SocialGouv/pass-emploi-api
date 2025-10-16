import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { JobHandler } from '../../building-blocks/types/job-handler'
import {
  EvenementMilo,
  EvenementMiloRepositoryToken
} from '../../domain/milo/evenement.milo'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService,
  ProcessJobType
} from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'
import { ConfigService } from '@nestjs/config'

@Injectable()
@ProcessJobType(Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO)
export class SuivreEvenementsMiloCronJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(EvenementMiloRepositoryToken)
    private evenementMiloRepository: EvenementMilo.Repository,
    private dateService: DateService,
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private readonly configService: ConfigService
  ) {
    super(Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const debutDuJob = this.dateService.now()
    let nombreEvenementsMax = this.configService.get(
      'milo.maxNombreEvenementsBatch'
    ) as number
    let nombreEvenementsTraites = 0
    try {
      const jobEstEnCours =
        await this.planificateurRepository.existePlusQuUnJobActifDeCeType(
          this.jobType
        )

      if (jobEstEnCours) {
        this.logger.warn('un job est en cours')
        return {
          jobType: this.jobType,
          dateExecution: debutDuJob,
          succes: false,
          resultat: { nombreEvenementsTraites, nombreEvenementsMax },
          nbErreurs: 0,
          tempsExecution: DateService.calculerTempsExecution(debutDuJob)
        }
      }
      let evenementsMilo: EvenementMilo[] = []
      do {
        evenementsMilo = await this.evenementMiloRepository.findAllEvenements()
        if (evenementsMilo.length > nombreEvenementsMax)
          evenementsMilo = evenementsMilo.slice(0, nombreEvenementsMax)

        const evenementsAPlanifier = trouverEvenementsAPlanifier(evenementsMilo)
        for (const evenementAPlanifier of evenementsAPlanifier) {
          await this.planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant(
            evenementAPlanifier
          )
        }

        for (const evenement of evenementsMilo) {
          await this.evenementMiloRepository.acquitterEvenement(evenement)
        }
        nombreEvenementsTraites += evenementsMilo.length
        nombreEvenementsMax -= evenementsMilo.length
      } while (evenementsMilo.length > 0 && nombreEvenementsMax > 0)

      return {
        jobType: this.jobType,
        dateExecution: debutDuJob,
        succes: true,
        resultat: {
          nombreEvenementsTraites,
          nombreEvenementsMax,
          nombreEvenementsFile: evenementsMilo.length
        },
        nbErreurs: 0,
        tempsExecution: DateService.calculerTempsExecution(debutDuJob)
      }
    } catch (e) {
      this.logger.error(e)
      return {
        jobType: this.jobType,
        dateExecution: debutDuJob,
        succes: false,
        resultat: { nombreEvenementsTraites, nombreEvenementsMax },
        nbErreurs: 1,
        tempsExecution: DateService.calculerTempsExecution(debutDuJob),
        erreur: e
      }
    }
  }
}

function trouverEvenementsAPlanifier(
  evenementsMilo: EvenementMilo[]
): EvenementMilo[] {
  const evenementsAGarder: EvenementMilo[] = []
  const sessionsAGarder: { [key: string]: EvenementMilo } = {}

  for (const evenement of evenementsMilo) {
    if (evenement.objet !== EvenementMilo.ObjetEvenement.SESSION) {
      evenementsAGarder.push(evenement)
    } else {
      const key = `${evenement.idPartenaireBeneficiaire}-${evenement.objet}-${evenement.action}-${evenement.idObjet}`
      if (
        !sessionsAGarder[key] ||
        new Date(evenement.date) > new Date(sessionsAGarder[key].date)
      ) {
        sessionsAGarder[key] = evenement
      }
    }
  }
  return evenementsAGarder.concat(Object.values(sessionsAGarder))
}
