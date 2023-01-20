import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Command } from '../../building-blocks/types/command'
import { Authentification } from '../../domain/authentification'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import * as os from 'os'
import { SuiviPeCejSqlModel } from '../../infrastructure/sequelize/models/suivi-pe-cej.sql-model'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'

export interface MettreAJourLesJeunesCEJPoleEmploiCommand extends Command {
  fichier: Express.Multer.File
}

@Injectable()
export class MettreAJourLesJeunesCejPeCommandHandler extends CommandHandler<
  MettreAJourLesJeunesCEJPoleEmploiCommand,
  void
> {
  async authorize(
    _command: MettreAJourLesJeunesCEJPoleEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type !== Authentification.Type.SUPPORT) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async handle(
    command: MettreAJourLesJeunesCEJPoleEmploiCommand
  ): Promise<Result> {
    const data = command.fichier.buffer.toString('utf8').split(os.EOL)
    data.shift()
    data.pop()
    const suiviPeCej = data.map(line => ({
      id: line
    }))
    await SuiviPeCejSqlModel.truncate()
    await SuiviPeCejSqlModel.bulkCreate(suiviPeCej)
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
