import { Injectable } from '@nestjs/common'
import { AntivirusClient } from 'src/infrastructure/clients/antivirus-client'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier } from '../../domain/fichier'

export interface AnalyserFichierCommand extends Command {
  fichier: {
    buffer: Buffer
    mimeType: string
    name: string
    size: number
  }
}

export type AnalyserFichierCommandOutput = {
  status: boolean
  uuid?: string
  error?: string
}

@Injectable()
export class AnalyserFichierCommandHandler extends CommandHandler<
  AnalyserFichierCommand,
  AnalyserFichierCommandOutput
> {
  constructor(
    private antivirusClient: AntivirusClient,
    private fichierFactory: Fichier.Factory
  ) {
    super('AnalyserFichierCommandHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    command: AnalyserFichierCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<AnalyserFichierCommandOutput>> {
    const fichierACreer: Fichier.ACreer = {
      ...command,
      jeunesIds: [],
      createur: { id: utilisateur.id, type: utilisateur.type }
    }

    const fichierCree = this.fichierFactory.creer(fichierACreer)
    if (isFailure(fichierCree)) return fichierCree

    return this.antivirusClient.analyze(fichierCree.data)
  }

  async monitor(): Promise<void> {
    return
  }
}
