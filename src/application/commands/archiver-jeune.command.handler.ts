import { Inject, Injectable } from '@nestjs/common'
import {
  ArchivageJeunesRepositoryToken,
  ArchiveJeune
} from 'src/domain/archive-jeune'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'

import { Chat, ChatRepositoryToken } from '../../domain/chat'

import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { DateService } from '../../utils/date-service'
import { Mail, MailServiceToken } from '../../domain/mail'

export interface ArchiverJeuneCommand {
  idJeune: Jeune.Id
  motif: ArchiveJeune.MotifSuppression
  commentaire?: string
}

@Injectable()
export class ArchiverJeuneCommandHandler extends CommandHandler<
  ArchiverJeuneCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ArchivageJeunesRepositoryToken)
    private readonly archivageJeuneRepository: ArchiveJeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private evenementService: EvenementService,
    private authorizeConseillerForJeune: ConseillerForJeuneAuthorizer,
    private dateService: DateService,
    @Inject(MailServiceToken)
    private readonly mailService: Mail.Service
  ) {
    super('ArchiverJeuneCommandHandler')
  }

  async authorize(
    command: ArchiverJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizeConseillerForJeune.authorize(
      command.idJeune,
      utilisateur
    )
  }

  async handle(command: ArchiverJeuneCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const metadonneesArchive: ArchiveJeune.Metadonnees = {
      idJeune: command.idJeune,
      email: jeune.email,
      prenomJeune: jeune.firstName,
      nomJeune: jeune.lastName,
      motif: command.motif,
      commentaire: command.commentaire,
      dateArchivage: this.dateService.nowJs()
    }
    await this.archivageJeuneRepository.archiver(metadonneesArchive)

    await this.authentificationRepository.deleteJeuneIdp(command.idJeune)
    await this.jeuneRepository.supprimer(command.idJeune)
    await this.chatRepository.supprimerChat(command.idJeune)

    await this.mailService.envoyerEmailJeuneSuppressionDeSonCompte(
      jeune,
      command.motif,
      command.commentaire
    )

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.COMPTE_ARCHIVE,
      utilisateur
    )
  }
}
