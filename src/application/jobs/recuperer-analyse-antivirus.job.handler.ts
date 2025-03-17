import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import {
  AnalyseAntivirusPasTerminee,
  FichierMalveillant
} from '../../building-blocks/types/domain-error'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { isFailure } from '../../building-blocks/types/result'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import {
  Fichier,
  FichierMetadata,
  FichierRepositoryToken
} from '../../domain/fichier'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { AntivirusClient } from '../../infrastructure/clients/antivirus-client'
import { DateService } from '../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.RECUPERER_ANALYSE_ANTIVIRUS)
export class RecupererAnalyseAntivirusJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(FichierRepositoryToken)
    private readonly fichierRepository: Fichier.Repository,
    private readonly antivirusClient: AntivirusClient,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(PlanificateurRepositoryToken)
    private readonly planificateurRepository: Planificateur.Repository,
    private readonly configService: ConfigService,
    private readonly dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.RECUPERER_ANALYSE_ANTIVIRUS, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobRecupererAnalyseAntivirus>
  ): Promise<SuiviJob> {
    const debut = this.dateService.now()

    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      job.contenu.idFichier
    )
    if (!fichierMetadata)
      return this.buildSuiviErreur(debut, 'Fichier non trouvé')
    if (!fichierMetadata.idAnalyse)
      return this.buildSuiviErreur(debut, 'Analyse non trouvée')
    if (!fichierMetadata.idMessage)
      return this.buildSuiviErreur(debut, 'Message non trouvé')

    const resultat = await this.antivirusClient.recupererResultatAnalyse(
      fichierMetadata.idAnalyse
    )
    if (isFailure(resultat)) {
      if (resultat.error instanceof FichierMalveillant)
        return this.enregistrerFichierMalveillant(debut, fichierMetadata)

      if (resultat.error instanceof AnalyseAntivirusPasTerminee)
        return this.replanifierAnalyse(debut, job)

      return this.buildSuiviSucces(debut, 'Erreur API jecliqueoupas')
    }

    return this.enregistrerFichierSain(debut, fichierMetadata)
  }

  private async enregistrerFichierSain(
    debut: DateTime,
    { idCreateur, idMessage }: FichierMetadata
  ): Promise<SuiviJob> {
    await this.chatRepository.envoyerStatutAnalysePJ(
      idCreateur,
      idMessage!,
      Chat.StatutPJ.FICHIER_SAIN
    )
    return this.buildSuiviSucces(debut, 'Fichier sain')
  }

  private async enregistrerFichierMalveillant(
    debut: DateTime,
    { id, idCreateur, idMessage }: FichierMetadata
  ): Promise<SuiviJob> {
    await this.chatRepository.envoyerStatutAnalysePJ(
      idCreateur,
      idMessage!,
      Chat.StatutPJ.FICHIER_MALVEILLANT
    )
    await this.fichierRepository.softDelete(id)
    return this.buildSuiviSucces(debut, 'Fichier malveillant')
  }

  private async replanifierAnalyse(
    debut: DateTime,
    job: Planificateur.Job<Planificateur.JobRecupererAnalyseAntivirus>
  ): Promise<SuiviJob> {
    const intervalle = this.configService.get<number>(
      'jecliqueoupas.intervalleAnalyse'
    )
    const dateExecution = this.dateService.now().plus({ seconds: intervalle })
    await this.planificateurRepository.ajouterJob({
      ...job,
      dateExecution: dateExecution.toJSDate()
    })
    return this.buildSuiviSucces(
      debut,
      'Récupération résultat analyse replanifiée'
    )
  }

  private buildSuiviErreur(date: DateTime, erreur: string): SuiviJob {
    return {
      jobType: this.jobType,
      nbErreurs: 1,
      succes: false,
      dateExecution: date,
      tempsExecution: DateService.calculerTempsExecution(date),
      resultat: { resultat: erreur }
    }
  }

  private buildSuiviSucces(date: DateTime, succes: string): SuiviJob {
    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: date,
      tempsExecution: DateService.calculerTempsExecution(date),
      resultat: { resultat: succes }
    }
  }
}
