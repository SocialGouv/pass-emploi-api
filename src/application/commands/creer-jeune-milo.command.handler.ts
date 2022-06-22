import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { NotFound, Unauthorized } from '../../domain/erreur'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { Milo, MiloRepositoryToken } from '../../domain/milo'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import {
  DossierExisteDejaError,
  EmailExisteDejaError
} from '../../building-blocks/types/domain-error'

export interface CreerJeuneMiloCommand extends Command {
  idDossier: string
  nom: string
  prenom: string
  email: string
  idConseiller: string
}

@Injectable()
export class CreerJeuneMiloCommandHandler extends CommandHandler<
  CreerJeuneMiloCommand,
  Core.Id
> {
  constructor(
    private idService: IdService,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(MiloRepositoryToken) private miloRepository: Milo.Repository,
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(AuthentificationRepositoryToken)
    private authentificationRepository: Authentification.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ChatRepositoryToken) private chatRepository: Chat.Repository
  ) {
    super('CreerJeuneMiloCommandHandler')
  }

  async handle(command: CreerJeuneMiloCommand): Promise<Result<Core.Id>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      throw new NotFound(command.idConseiller, 'Conseiller')
    }
    const lowerCaseEmail = command.email.toLocaleLowerCase()
    const [jeuneByEmail, jeuneByIdDossier] = await Promise.all([
      this.jeuneRepository.getByEmail(lowerCaseEmail),
      this.jeuneRepository.getByIdDossier(command.idDossier)
    ])
    if (jeuneByEmail) {
      return failure(new EmailExisteDejaError(lowerCaseEmail))
    }
    if (jeuneByIdDossier) {
      return failure(new DossierExisteDejaError(command.idDossier))
    }

    const result = await this.miloRepository.creerJeune(command.idDossier)

    if (isFailure(result)) {
      return result
    }

    const utilisateur: Authentification.Utilisateur = {
      id: this.idService.uuid(),
      idAuthentification: result.data.idAuthentification,
      prenom: command.prenom,
      nom: command.nom,
      structure: Core.Structure.MILO,
      type: Authentification.Type.JEUNE,
      email: lowerCaseEmail,
      roles: []
    }
    await this.authentificationRepository.saveJeune(
      utilisateur,
      conseiller.id,
      command.idDossier,
      this.dateService.nowJs()
    )
    await this.chatRepository.initializeChatIfNotExists(
      utilisateur.id,
      conseiller.id
    )

    return success({ id: utilisateur.id })
  }

  async authorize(
    command: CreerJeuneMiloCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      !(
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.structure === Core.Structure.MILO
      )
    ) {
      throw new Unauthorized('CreerJeuneMilo')
    }
    await this.conseillerAuthorizer.authorize(command.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
