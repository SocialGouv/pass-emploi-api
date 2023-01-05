import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller } from '../../domain/conseiller/conseiller'
import {
  ListeDeDiffusion,
  ListeDeDiffusionRepositoryToken
} from '../../domain/conseiller/liste-de-diffusion'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { AuthorizeConseillerForJeunes } from '../authorizers/authorize-conseiller-for-jeunes'
import { AuthorizeListeDeDiffusion } from '../authorizers/authorize-liste-de-diffusion'

export interface TeleverserFichierCommand extends Command {
  fichier: {
    buffer: Buffer
    mimeType: string
    name: string
    size: number
  }
  jeunesIds?: string[]
  listesDeDiffusionIds?: string[]
  createur: {
    id: string
    type: Authentification.Type
  }
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
    private authorizeConseillerForJeunes: AuthorizeConseillerForJeunes,
    private authorizeListeDeDiffusion: AuthorizeListeDeDiffusion
  ) {
    super('TeleverserFichierCommandHandler')
  }

  async authorize(
    command: TeleverserFichierCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    let result: Result

    if (command.jeunesIds) {
      result = await this.authorizeConseillerForJeunes.authorize(
        command.jeunesIds,
        utilisateur
      )
      if (isFailure(result)) {
        return result
      }
    }
    if (command.listesDeDiffusionIds) {
      for (const idListe of command.listesDeDiffusionIds) {
        const result = await this.authorizeListeDeDiffusion.authorize(
          idListe,
          utilisateur
        )
        if (isFailure(result)) {
          return result
        }
      }
    }
    return emptySuccess()
  }

  async handle(
    command: TeleverserFichierCommand
  ): Promise<Result<TeleverserFichierCommandOutput>> {
    let jeunesIds = []

    if (command.listesDeDiffusionIds) {
      const listesDeDiffusion = await this.listeDeDiffusionRepository.findAll(
        command.listesDeDiffusionIds
      )

      const idsBeneficiaireDesListesDeDiffusion =
        ListeDeDiffusion.getIdsBeneficiaireDesListesDeDiffusion(
          listesDeDiffusion
        )

      jeunesIds = idsBeneficiaireDesListesDeDiffusion
        .concat(command.jeunesIds || [])
        .filter(isUnique)
    } else {
      jeunesIds = command.jeunesIds!
    }

    const fichierACreer: Fichier.ACreer = { ...command, jeunesIds }

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
