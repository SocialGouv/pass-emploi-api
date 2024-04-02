import { Inject, Injectable } from '@nestjs/common'
import { FichierAuthorizer } from 'src/application/authorizers/fichier-authorizer'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller } from '../../domain/milo/conseiller'
import {
  ListeDeDiffusion,
  ListeDeDiffusionRepositoryToken
} from '../../domain/milo/liste-de-diffusion'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'

export interface TeleverserFichierCommand extends Command {
  fichier: {
    buffer: Buffer
    mimeType: string
    name: string
    size: number
  }
  jeunesIds?: string[]
  listesDeDiffusionIds?: string[]
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
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private fichierFactory: Fichier.Factory,
    private fichierAuthorizer: FichierAuthorizer
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

    if (utilisateur.type === Authentification.Type.CONSEILLER) {
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

    const fichierACreer: Fichier.ACreer = {
      ...command,
      jeunesIds: jeunesIds.filter(isUnique),
      createur: { id: utilisateur.id, type: utilisateur.type }
    }

    const result = this.fichierFactory.creer(fichierACreer)

    if (isFailure(result)) {
      return result
    }
    await this.fichierRepository.save(result.data)
    return success({
      id: result.data.id,
      nom: result.data.nom
    })
  }

  async monitor(): Promise<void> {
    return
  }
}

function isUnique(value: string, index: number, self: string[]): boolean {
  return self.indexOf(value) === index
}
