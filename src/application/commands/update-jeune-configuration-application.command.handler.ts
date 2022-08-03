import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken,
  JeunesRepositoryToken
} from '../../domain/jeune/jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { ConfigurationApplication } from '../../domain/jeune/configuration-application'

export interface UpdateJeuneConfigurationApplicationCommand extends Command {
  idJeune: string
  pushNotificationToken: string
  appVersion?: string
  installationId?: string
}

@Injectable()
export class UpdateJeuneConfigurationApplicationCommandHandler extends CommandHandler<
  UpdateJeuneConfigurationApplicationCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private configurationApplicationFactory: ConfigurationApplication.Factory
  ) {
    super('UpdateJeuneConfigurationApplicationCommandHandler')
  }

  async handle(
    command: UpdateJeuneConfigurationApplicationCommand
  ): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError(command.idJeune, 'Jeune'))
    }

    const configurationApplication =
      this.configurationApplicationFactory.mettreAJour(command)

    await this.jeuneConfigurationApplicationRepository.save(
      configurationApplication
    )
    return emptySuccess()
  }

  async authorize(
    command: UpdateJeuneConfigurationApplicationCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
