import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FichierAuthorizer } from 'src/application/authorizers/fichier-authorizer'
import { Chat, ChatRepositoryToken } from 'src/domain/chat'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from 'src/domain/planificateur'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { Conseiller } from '../../domain/milo/conseiller'
import {
  ListeDeDiffusion,
  ListeDeDiffusionRepositoryToken
} from '../../domain/milo/liste-de-diffusion'
import estJeune = Authentification.estJeune
import estConseiller = Authentification.estConseiller
import { buildError } from '../../utils/logger.module'

export interface TeleverserFichierCommand extends Command {
  fichier: {
    buffer: Buffer
    mimeType: string
    name: string
    size: number
  }
  jeunesIds?: string[]
  listesDeDiffusionIds?: string[]
  idMessage?: string
}

export interface TeleverserFichierCommandOutput {
  id: string
  nom: string
}

@Injectable()
export class TeleverserFichierCommandHandler extends CommandHandler<
  TeleverserFichierCommand,
  TeleverserFichierCommandOutput
> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private fichierFactory: Fichier.Factory,
    private fichierAuthorizer: FichierAuthorizer,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private configService: ConfigService,
    private dateService: DateService
  ) {
    super('TeleverserFichierCommandHandler')
  }

  async authorize(
    command: TeleverserFichierCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.fichierAuthorizer.autoriserTeleversementDuFichier(
      utilisateur,
      command.jeunesIds,
      command.listesDeDiffusionIds
    )
  }

  async handle(
    command: TeleverserFichierCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<TeleverserFichierCommandOutput>> {
    const jeunesIds: string[] = []

    if (estConseiller(utilisateur.type)) {
      if (!command.listesDeDiffusionIds?.length && !command.jeunesIds?.length) {
        return failure(
          new MauvaiseCommandeError('Aucun jeune ou liste de diffusion')
        )
      }

      if (command.listesDeDiffusionIds?.length) {
        const listesDeDiffusion = await this.listeDeDiffusionRepository.findAll(
          command.listesDeDiffusionIds
        )

        const idsBeneficiaireDesListesDeDiffusion =
          ListeDeDiffusion.getIdsBeneficiaireDesListesDeDiffusion(
            listesDeDiffusion
          )

        jeunesIds.push(...idsBeneficiaireDesListesDeDiffusion)
      }

      if (command.jeunesIds?.length) jeunesIds.push(...command.jeunesIds)
    }
    if (estJeune(utilisateur.type) && !command.idMessage) {
      this.logger.warn(
        'Id du message manquant pour une pièce-jointe envoyée par un bénéficiaire'
      )
      return failure(new MauvaiseCommandeError('Id du message manquant'))
    }

    const fichierACreer: Fichier.ACreer = {
      ...command,
      jeunesIds: jeunesIds.filter(isUnique),
      createur: { id: utilisateur.id, type: utilisateur.type }
    }

    const resultCreationFichier = this.fichierFactory.creer(fichierACreer)
    if (isFailure(resultCreationFichier)) {
      return resultCreationFichier
    }
    await this.fichierRepository.save(resultCreationFichier.data)

    if (estJeune(utilisateur.type)) {
      this.declencherAnalyseAsynchrone(
        resultCreationFichier.data,
        utilisateur.id,
        command.idMessage!
      )
    }
    return success({
      id: resultCreationFichier.data.id,
      nom: resultCreationFichier.data.nom
    })
  }

  async monitor(): Promise<void> {
    return
  }

  async declencherAnalyseAsynchrone(
    fichier: Fichier,
    idJeune: string,
    idMessage: string
  ): Promise<void> {
    const MAX_TRY = 2
    try {
      let tryCount = 0,
        declenchementAnalyse: Result
      do {
        declenchementAnalyse =
          await this.fichierRepository.declencherAnalyseAsynchrone(fichier)
        tryCount++
      } while (isFailure(declenchementAnalyse) && tryCount < MAX_TRY)

      if (isFailure(declenchementAnalyse)) {
        this.fichierRepository.softDelete(fichier.id)
        this.chatRepository.envoyerStatutAnalysePJ(
          idJeune,
          idMessage,
          Chat.StatutPJ.ERREUR_ANALYSE
        )
        return
      }

      this.chatRepository.envoyerStatutAnalysePJ(
        idJeune,
        idMessage,
        Chat.StatutPJ.ANALYSE_EN_COURS
      )
      const intervalleRecuperationResultat = this.configService.get<number>(
        'jecliqueoupas.intervalleAnalyse'
      )
      const dateExecutionRecuperationResultat = this.dateService
        .now()
        .plus({ seconds: intervalleRecuperationResultat })
      this.logger.log('Planification JOB récupération analyse PJ')
      this.planificateurRepository.creerJob({
        dateExecution: dateExecutionRecuperationResultat.toJSDate(),
        type: Planificateur.JobType.RECUPERER_ANALYSE_ANTIVIRUS,
        contenu: { idFichier: fichier.id }
      })
    } catch (e) {
      this.logger.error(buildError('Erreur Analyse PJ', e))
      this.fichierRepository.softDelete(fichier.id)
      this.chatRepository.envoyerStatutAnalysePJ(
        idJeune,
        idMessage,
        Chat.StatutPJ.ERREUR_ANALYSE
      )
    }
  }
}

function isUnique(value: string, index: number, self: string[]): boolean {
  return self.indexOf(value) === index
}
