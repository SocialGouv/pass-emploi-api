import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { failure, Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estMilo } from '../../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../../domain/milo/conseiller'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { OidcClient } from '../../../infrastructure/clients/oidc-client.db'

export interface EnvoyerEmailActivationCommand extends Command {
  idConseiller: string
  idJeune: string
  accessToken: string
}

@Injectable()
export class EnvoyerEmailActivationCommandHandler extends CommandHandler<
  EnvoyerEmailActivationCommand,
  void
> {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private readonly miloClient: MiloClient,
    private oidcClient: OidcClient
  ) {
    super('EnvoyerEmailActivationCommandHandler')
  }

  async handle(command: EnvoyerEmailActivationCommand): Promise<Result> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune || !jeune.email) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const idpToken = await this.oidcClient.exchangeTokenConseillerMilo(
      command.accessToken
    )

    return this.miloClient.envoyerEmailActivation(idpToken, jeune.email)
  }

  async authorize(
    command: EnvoyerEmailActivationCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
      command.idConseiller,
      command.idJeune,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
