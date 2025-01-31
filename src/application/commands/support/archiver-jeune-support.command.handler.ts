import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../../building-blocks/types/result'
import {
  ArchiveJeune,
  ArchiveJeuneRepositoryToken
} from '../../../domain/archive-jeune'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../../domain/authentification'

import { Chat, ChatRepositoryToken } from '../../../domain/chat'

import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import { Mail, MailServiceToken } from '../../../domain/mail'
import { DateService } from '../../../utils/date-service'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'

const COMMENTAIRE_SUPPRESSION_SUPPORT =
  "Pour des raisons techniques nous avons procédé à l'archivage de votre compte."

export interface ArchiverJeuneSupportCommand {
  idJeune: Jeune.Id
}

@Injectable()
export class ArchiverJeuneSupportCommandHandler extends CommandHandler<
  ArchiverJeuneSupportCommand,
  void
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ArchiveJeuneRepositoryToken)
    private readonly archiveJeuneRepository: ArchiveJeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private authorizeSupport: SupportAuthorizer,
    private dateService: DateService,
    @Inject(MailServiceToken)
    private readonly mailService: Mail.Service
  ) {
    super('ArchiverJeuneSupportCommandHandler')
  }

  async authorize(
    _command: ArchiverJeuneSupportCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizeSupport.autoriserSupport(utilisateur)
  }

  async handle(command: ArchiverJeuneSupportCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const motif: ArchiveJeune.MotifSuppressionSupport = 'Support'

    const metadonneesArchive: ArchiveJeune.Metadonnees = {
      idJeune: command.idJeune,
      email: jeune.email,
      prenomJeune: jeune.firstName,
      nomJeune: jeune.lastName,
      structure: jeune.structure,
      dateCreation: jeune.creationDate.toJSDate(),
      datePremiereConnexion: jeune.datePremiereConnexion?.toJSDate(),
      motif,
      commentaire: COMMENTAIRE_SUPPRESSION_SUPPORT,
      dateArchivage: this.dateService.nowJs(),
      dispositif: jeune.dispositif
    }
    await this.archiveJeuneRepository.archiver(metadonneesArchive)

    await this.authentificationRepository.deleteUtilisateurIdp(command.idJeune)
    await this.jeuneRepository.supprimer(command.idJeune)
    await this.chatRepository.supprimerChat(command.idJeune)

    await this.mailService.envoyerEmailJeuneArchive(
      jeune,
      motif,
      COMMENTAIRE_SUPPRESSION_SUPPORT
    )

    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
