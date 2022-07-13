import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DateService } from '../../utils/date-service'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface UpdateNotificationTokenCommand extends Command {
  idJeune: string
  token: string
  appVersion?: string
}

@Injectable()
export class UpdateNotificationTokenCommandHandler extends CommandHandler<
  UpdateNotificationTokenCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(AuthentificationRepositoryToken)
    private utilisateurRepository: Authentification.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private dateService: DateService
  ) {
    super('UpdateNotificationTokenCommandHandler')
  }

  async handle(command: UpdateNotificationTokenCommand): Promise<Result<void>> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError(command.idJeune, 'Jeune'))
    }

    const jeuneMisAJour = Jeune.updateToken(
      jeune,
      command.token,
      this.dateService
    )
    await this.jeuneRepository.save(jeuneMisAJour)

    if (command.appVersion) {
      this.utilisateurRepository.updateJeune({
        id: jeuneMisAJour.id,
        appVersion: command.appVersion
      })
    }
    return emptySuccess()
  }

  async authorize(
    command: UpdateNotificationTokenCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
