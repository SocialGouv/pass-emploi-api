import { Inject, Injectable } from '@nestjs/common'
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

import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Mail, MailServiceToken } from '../../domain/mail'
import { DateService } from '../../utils/date-service'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'

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

    const metadonneesArchive: ArchiveJeune.Metadonnees = {
      idJeune: command.idJeune,
      email: jeune.email,
      prenomJeune: jeune.firstName,
      nomJeune: jeune.lastName,
      structure: jeune.structure,
      dateCreation: jeune.creationDate.toJSDate(),
      datePremiereConnexion: jeune.datePremiereConnexion?.toJSDate(),
      motif: command.motif,
      commentaire: command.commentaire,
      dateArchivage: this.dateService.nowJs()
    }
    const resultArchiver = await this.archiveJeuneRepository.archiver(
      metadonneesArchive
    )
    if (isFailure(resultArchiver)) {
      return resultArchiver
    }

    await this.jeuneRepository.supprimer(command.idJeune)
    await this.chatRepository.supprimerChat(command.idJeune)

    await this.mailService.envoyerEmailJeuneArchive(
      jeune,
      command.motif,
      command.commentaire
    )

    // TODO mesurer le taux de retry des conseillers sur 1 mois sur la commande
    await this.authentificationRepository.deleteUtilisateurIdp(command.idJeune)
    /*
    const MAX_RETRY = 3
    for (let i = 0; i < MAX_RETRY; i++) {
      try {
        await this.authentificationRepository.deleteUtilisateurIdp(
          command.idJeune
        )
        return emptySuccess()
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        this.logger.log(
          `Suppression Keycloak User - Essai ${i + 1} en échec : ${e}`
        )
      }
    }
    // Si on arrive ici, la suppression Keycloak a échoué
    // return emptySuccess()
    */
    retry(
      this.authentificationRepository.deleteUtilisateurIdp(command.idJeune)
    ).catch(e => {
      this.logger.log('Suppression user keycloak échouée')
      throw new RuntimeException(e)
    })
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.COMPTE_ARCHIVE,
      utilisateur
    )
  }
}

function delay(t): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, t)
  })
}

async function retry(promise, retries = 3, e = null) {
  if (!retries) {
    return Promise.reject(e)
  }
  return promise.catch(e => {
    delay(5000)
    return retry(promise, retries - 1, e)
  })
}
