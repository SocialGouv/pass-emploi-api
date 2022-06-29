import { Inject, Injectable } from '@nestjs/common'
import {
  ArchivageJeune,
  ArchivageJeunesRepositoryToken
} from 'src/domain/archivage-jeune'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Mail, MailServiceToken } from 'src/domain/mail'
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

export interface ArchiverJeuneCommand {
  idJeune: Jeune.Id
  motif: ArchivageJeune.Motif
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
    private readonly archivageJeuneRepository: ArchivageJeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private evenementService: EvenementService,
    @Inject(MailServiceToken)
    private readonly mailService: Mail.Service,
    private mailFactory: Mail.Factory,
    private authorizeConseillerForJeune: ConseillerForJeuneAuthorizer,
    private dateService: DateService
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

    const archive = await this.archivageJeuneRepository.construire(
      jeune.id,
      this.dateService.nowJs(),
      command.motif,
      command.commentaire
    )
    await this.archivageJeuneRepository.archiver(archive!)

    if (false) {
      await this.authentificationRepository.deleteJeuneIdp(command.idJeune)
      await this.jeuneRepository.supprimer(command.idJeune)
      await this.chatRepository.supprimerChat(command.idJeune)

      if (jeune!.conseiller?.email) {
        const mail = this.mailFactory.creerMailSuppressionJeune(jeune!)
        await this.mailService.envoyer(mail)
      } else {
        this.logger.warn(
          `Email non envoyé au conseiller : ${JSON.stringify(
            jeune!.conseiller
          )}`
        )
      }
    }

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.COMPTE_SUPPRIME,
      utilisateur
    )
  }
}
