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
      return failure(new MauvaiseCommandeError('Id du message manquant'))
    }

    const fichierACreer: Fichier.ACreer = {
      ...command,
      jeunesIds: jeunesIds.filter(isUnique),
      createur: { id: utilisateur.id, type: utilisateur.type }
    }

    const result = this.fichierFactory.creer(fichierACreer)
    if (isFailure(result)) return result
    await this.fichierRepository.save(result.data)

    if (estJeune(utilisateur.type)) {
      this.declencherAnalyseAsynchrone(
        result.data,
        utilisateur.id,
        command.idMessage!
      )
    }
    return success({
      id: result.data.id,
      nom: result.data.nom
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
    const resultAnalyse =
      await this.fichierRepository.declencherAnalyseAsynchrone(fichier)
    if (isFailure(resultAnalyse)) {
      // TODO softDelete ou job pour ressayer l'analyse ?
      this.chatRepository.envoyerStatutAnalysePJ(
        idJeune,
        idMessage,
        'ERREUR_ANALYSE'
      )
      return
    }

    this.chatRepository.envoyerStatutAnalysePJ(
      idJeune,
      idMessage,
      'ANALYSE_EN_COURS'
    )
    const intervalle = this.configService.get<number>(
      'jecliqueoupas.intervalleAnalyse'
    )
    const dateExecution = this.dateService.now().plus({ seconds: intervalle })
    this.planificateurRepository.creerJob({
      dateExecution: dateExecution.toJSDate(),
      type: Planificateur.JobType.RECUPERERE_ANALYSE_ANTIVIRUS,
      contenu: { idFichier: fichier.id }
    })
  }
}

function isUnique(value: string, index: number, self: string[]): boolean {
  return self.indexOf(value) === index
}
