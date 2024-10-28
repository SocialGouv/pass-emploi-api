import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  Result,
  emptySuccess,
  failure,
  isFailure
} from '../../building-blocks/types/result'
import {
  ArchiveJeune,
  ArchiveJeuneRepositoryToken
} from '../../domain/archive-jeune'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'

import { Chat, ChatRepositoryToken } from '../../domain/chat'

import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Mail, MailServiceToken } from '../../domain/mail'
import { DateService } from '../../utils/date-service'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

export interface ArchiverJeuneCommand {
  idJeune: Jeune.Id
  motif: ArchiveJeune.MotifSuppression
  dateFinAccompagnement?: DateTime
  commentaire?: string
}

@Injectable()
export class ArchiverJeuneCommandHandler extends CommandHandler<
  ArchiverJeuneCommand,
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
    private evenementService: EvenementService,
    private conseillerAuthorizer: ConseillerAuthorizer,
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
    return this.conseillerAuthorizer.autoriserConseillerPourSonJeune(
      command.idJeune,
      utilisateur
    )
  }

  async handle(command: ArchiverJeuneCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const verificationDate = this.verifierDateFinAccompagnement(command, jeune)
    if (isFailure(verificationDate)) return verificationDate

    await this.authentificationRepository.deleteUtilisateurIdp(command.idJeune)

    const metadonneesArchive: ArchiveJeune.Metadonnees = {
      idJeune: command.idJeune,
      email: jeune.email,
      prenomJeune: jeune.firstName,
      nomJeune: jeune.lastName,
      structure: jeune.structure,
      dateCreation: jeune.creationDate.toJSDate(),
      datePremiereConnexion: jeune.datePremiereConnexion?.toJSDate(),
      dateFinAccompagnement: command.dateFinAccompagnement?.toJSDate(),
      motif: command.motif,
      commentaire: command.commentaire,
      dateArchivage: this.dateService.nowJs(),
      idPartenaire: jeune.idPartenaire
    }

    try {
      const resultArchiver = await this.archiveJeuneRepository.archiver(
        metadonneesArchive
      )
      if (isFailure(resultArchiver)) {
        return resultArchiver
      }
    } catch (e) {
      this.logger.error(e)
    }

    await this.jeuneRepository.supprimer(command.idJeune)
    this.chatRepository.supprimerChat(command.idJeune)

    this.mailService.envoyerEmailJeuneArchive(
      jeune,
      command.motif,
      command.commentaire
    )

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.COMPTE_ARCHIVE,
      utilisateur
    )
  }

  private verifierDateFinAccompagnement(
    command: ArchiverJeuneCommand,
    jeune: Jeune
  ): Result {
    if (
      command.dateFinAccompagnement &&
      command.dateFinAccompagnement < jeune.creationDate
    ) {
      return failure(
        new MauvaiseCommandeError(
          'Le date de fin d’accompagnement doit être postérieure à la date de création du bénéficiaire'
        )
      )
    }
    if (
      command.dateFinAccompagnement &&
      command.dateFinAccompagnement > this.dateService.now()
    ) {
      return failure(
        new MauvaiseCommandeError(
          'Le date de fin d’accompagnement ne peut pas être dans le futur'
        )
      )
    }

    return emptySuccess()
  }
}
