import { Injectable } from '@nestjs/common'
import * as os from 'os'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { SuiviPeCejSqlModel } from '../../../infrastructure/sequelize/models/suivi-pe-cej.sql-model'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'

export interface MettreAJourLesJeunesCEJPoleEmploiCommand extends Command {
  fichier: Express.Multer.File
}

@Injectable()
export class MettreAJourLesJeunesCejPeCommandHandler extends CommandHandler<
  MettreAJourLesJeunesCEJPoleEmploiCommand,
  void
> {
  constructor(private supportAuthorizer: SupportAuthorizer) {
    super('MettreAJourLesJeunesCejPeCommandHandler')
  }

  async authorize(
    _command: MettreAJourLesJeunesCEJPoleEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
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
