import { Command } from 'src/building-blocks/types/command'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from 'src/building-blocks/types/result'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { DateService } from '../../../utils/date-service'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from 'src/domain/milo/session.milo'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'

export interface UpdateSessionMiloCommand extends Command {
  idSession: string
  idConseiller: string
  token: string
  estVisible: boolean
  inscriptions?: Array<Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>>
}

@Injectable()
export class UpdateSessionMiloCommandHandler extends CommandHandler<
  UpdateSessionMiloCommand,
  void
> {
  constructor(
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    @Inject(SessionMiloRepositoryToken)
    private sessionMiloRepository: SessionMilo.Repository,
    private miloClient: MiloClient,
    private keycloakClient: KeycloakClient,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('UpdateSessionMiloCommandHandler')
  }

  async handle(command: UpdateSessionMiloCommand): Promise<Result> {
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

    const resultModification = SessionMilo.modifier(
      session,
      command.estVisible,
      command.inscriptions ?? [],
      this.dateService.now()
    )
    if (isFailure(resultModification)) return resultModification
    const { sessionModifiee, nouvellesInscriptions } = resultModification.data

    await this.sessionMiloRepository.save(
      sessionModifiee,
      nouvellesInscriptions,
      idpToken
    )

    return emptySuccess()
  }

  async authorize(
    command: UpdateSessionMiloCommand,
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
