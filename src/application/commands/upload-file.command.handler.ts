import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { AuthorizeConseillerForJeunes } from '../authorizers/authorize-conseiller-for-jeunes'

export interface UploadFileCommand extends Command {
  file: {
    buffer: Buffer
    mimeType: string
    name: string
    size: number
  }
  jeunesIds: string[]
}
export interface UploadFileCommandOutput {
  id: string
  nom: string
}

@Injectable()
export class UploadFileCommandHandler extends CommandHandler<
  UploadFileCommand,
  UploadFileCommandOutput
> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    private fichierFactory: Fichier.Factory,
    private authorizeConseillerForJeunes: AuthorizeConseillerForJeunes
  ) {
    super('UploadFileCommandHandler')
  }

  async authorize(
    command: UploadFileCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.authorizeConseillerForJeunes.authorize(
      command.jeunesIds,
      utilisateur
    )
  }

  async handle(
    command: UploadFileCommand
  ): Promise<Result<UploadFileCommandOutput>> {
    const result = this.fichierFactory.creer(command)

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
