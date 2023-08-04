import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from 'src/domain/milo/session.milo'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client'
import { DateService } from 'src/utils/date-service'

export interface EmargementSessionMiloCommand extends Command {
  idSession: string
  idConseiller: string
  token: string
  emargements: SessionMilo.Modification.Emargement[]
}

@Injectable()
export class EmargementSessionMiloCommandHandler extends CommandHandler<
  EmargementSessionMiloCommand,
  void
> {
  constructor(
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    @Inject(SessionMiloRepositoryToken)
    private sessionMiloRepository: SessionMilo.Repository,
    private keycloakClient: KeycloakClient,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('UpdateSessionMiloCommandHandler')
  }

  async handle(command: EmargementSessionMiloCommand): Promise<Result> {
    const conseillerMiloResult = await this.conseillerMiloRepository.get(
      command.idConseiller
    )
    if (isFailure(conseillerMiloResult)) return conseillerMiloResult
    const { structure: structureConseiller } = conseillerMiloResult.data

    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      command.token
    )

    const resultSession = await this.sessionMiloRepository.getForConseiller(
      command.idSession,
      structureConseiller,
      idpToken
    )
    if (isFailure(resultSession)) return resultSession

    const session = resultSession.data

    const resultEmargement = await SessionMilo.emarger(
      session,
      command.emargements,
      this.dateService.now()
    )
    if (isFailure(resultEmargement)) return resultEmargement

    const resultSave = await this.sessionMiloRepository.save(
      resultEmargement.data.sessionEmargee,
      {
        idsJeunesAInscrire: [],
        inscriptionsASupprimer: [],
        inscriptionsAModifier: resultEmargement.data.inscriptionsAModifier
      },
      idpToken
    )
    if (isFailure(resultSave)) return resultSave

    return emptySuccess()
  }

  async authorize(
    command: EmargementSessionMiloCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
