import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from 'src/domain/milo/session.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { DateService } from '../../../utils/date-service'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { Notification } from '../../../domain/notification/notification'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import Inscription = SessionMilo.Inscription

export interface UpdateSessionMiloCommand extends Command {
  idSession: string
  idConseiller: string
  accessToken: string
  estVisible?: boolean
  inscriptions?: SessionMilo.Modification.Inscription[]
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
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private keycloakClient: KeycloakClient,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private notificationService: Notification.Service
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
      command.accessToken
    )

    const resultSession = await this.sessionMiloRepository.getForConseiller(
      command.idSession,
      structureConseiller,
      idpToken
    )
    if (isFailure(resultSession)) return resultSession
    const session = resultSession.data

    const sessionModifiee = SessionMilo.modifier(
      session,
      this.dateService.now(),
      command.estVisible
    )

    const resultInscriptions = SessionMilo.extraireInscriptionsATraiter(
      session,
      command.inscriptions ?? []
    )
    if (isFailure(resultInscriptions)) return resultInscriptions
    const inscriptionsATraiter = resultInscriptions.data

    const resultSave = await this.sessionMiloRepository.save(
      sessionModifiee,
      inscriptionsATraiter,
      idpToken
    )
    if (isFailure(resultSave)) return resultSave

    const [
      jeunesANotifiersInscription = [],
      jeunesANotifiersModification = [],
      jeunesANotifiersSuppression = []
    ] = await Promise.all([
      this.jeuneRepository.findAll(inscriptionsATraiter.idsJeunesAInscrire),
      this.jeuneRepository.findAll(
        inscriptionsATraiter.inscriptionsAModifier
          .filter(
            inscription => inscription.statut !== Inscription.Statut.INSCRIT
          )
          .map(inscription => inscription.idJeune)
      ),
      this.jeuneRepository.findAll(
        inscriptionsATraiter.inscriptionsASupprimer.map(
          inscription => inscription.idJeune
        )
      )
    ])

    // todo concat avec les jeunes qui ont été modifier en inscription
    if (jeunesANotifiersInscription.length) {
      this.notificationService.notifierInscriptionSession(
        session.id,
        jeunesANotifiersInscription
      )
    }

    if (
      jeunesANotifiersModification.length ||
      jeunesANotifiersSuppression.length
    ) {
      this.notificationService.notifierDesinscriptionSession(
        session.id,
        session.debut,
        jeunesANotifiersModification.concat(jeunesANotifiersSuppression)
      )
    }

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
