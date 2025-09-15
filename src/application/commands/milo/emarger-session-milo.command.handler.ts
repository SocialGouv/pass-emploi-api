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
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo.db'
import { Conseiller } from '../../../domain/conseiller'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { DateService } from 'src/utils/date-service'

export interface EmargerSessionMiloCommand extends Command {
  idSession: string
  idConseiller: string
  accessToken: string
  emargements: SessionMilo.Modification.Emargement[]
}

@Injectable()
export class EmargerSessionMiloCommandHandler extends CommandHandler<
  EmargerSessionMiloCommand,
  void
> {
  constructor(
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    @Inject(SessionMiloRepositoryToken)
    private sessionMiloRepository: SessionMilo.Repository,
    private oidcClient: OidcClient,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('EmargerSessionMiloCommandHandler')
  }

  async handle(command: EmargerSessionMiloCommand): Promise<Result> {
    const conseillerMiloResult = await this.conseillerMiloRepository.get(
      command.idConseiller
    )
    if (isFailure(conseillerMiloResult)) return conseillerMiloResult
    const { structure: structureConseiller } = conseillerMiloResult.data

    const idpToken = await this.oidcClient.exchangeTokenConseillerMilo(
      command.accessToken
    )

    const resultSession = await this.sessionMiloRepository.getForConseiller(
      command.idSession,
      structureConseiller,
      idpToken
    )
    if (isFailure(resultSession)) return resultSession

    const session = resultSession.data

    const resultEmargement = SessionMilo.emarger(
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
    command: EmargerSessionMiloCommand,
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
