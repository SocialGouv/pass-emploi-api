import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import {
  Result,
  emptySuccess,
  isFailure
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/milo/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo.db'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from 'src/domain/milo/session.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import { DateService } from '../../../utils/date-service'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import Inscription = SessionMilo.Inscription
import { Evenement, EvenementService } from '../../../domain/evenement'

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
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private keycloakClient: KeycloakClient,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private notificationService: Notification.Service,
    private evenementService: EvenementService
  ) {
    super('UpdateSessionMiloCommandHandler')
  }

  async handle(
    command: UpdateSessionMiloCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const conseillerMiloResult = await this.conseillerMiloRepository.get(
      command.idConseiller
    )
    if (isFailure(conseillerMiloResult)) {
      return conseillerMiloResult
    }
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
    if (isFailure(resultInscriptions)) {
      return resultInscriptions
    }
    const inscriptionsATraiter = resultInscriptions.data

    const resultSave = await this.sessionMiloRepository.save(
      sessionModifiee,
      inscriptionsATraiter,
      idpToken
    )
    if (isFailure(resultSave)) return resultSave

    const [
      jeunesANotifierInscription = [],
      jeunesModifiesANotifierDesinscription = [],
      jeunesSupprimesANotifierDesinscription = []
    ] = await Promise.all([
      this.jeuneRepository.findAll(inscriptionsATraiter.idsJeunesAInscrire),
      this.jeuneRepository.findAll(
        trouverListesJeunesModifiesPourDesinscription(
          inscriptionsATraiter.inscriptionsAModifier
        )
      ),
      this.jeuneRepository.findAll(
        inscriptionsATraiter.inscriptionsASupprimer.map(
          inscription => inscription.idJeune
        )
      )
    ])

    if (jeunesANotifierInscription.length) {
      this.notificationService.notifierInscriptionSession(
        session.id,
        jeunesANotifierInscription
      )
      this.evenementService.creer(
        Evenement.Code.SESSION_INSCRIPTION,
        utilisateur
      )
    }

    const jeunesANotifierDesinscription =
      jeunesModifiesANotifierDesinscription.concat(
        jeunesSupprimesANotifierDesinscription
      )
    if (jeunesANotifierDesinscription.length) {
      this.notificationService.notifierDesinscriptionSession(
        session.id,
        session.debut,
        jeunesANotifierDesinscription
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

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: UpdateSessionMiloCommand
  ): Promise<void> {
    if (Authentification.estConseiller(utilisateur.type)) {
      if (command.estVisible !== undefined) {
        this.evenementService.creer(
          Evenement.Code.SESSION_MODIFICATION,
          utilisateur
        )
      }
    }
  }
}

function trouverListesJeunesModifiesPourDesinscription(
  toto: Array<Omit<Inscription, 'nom' | 'prenom'>>
): string[] {
  return toto
    .filter(inscription => inscription.statut !== Inscription.Statut.INSCRIT)
    .map(inscription => inscription.idJeune)
}
