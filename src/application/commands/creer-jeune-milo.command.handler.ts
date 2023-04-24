import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
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
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { Core } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import {
  JeuneMilo,
  MiloJeuneRepositoryToken
} from '../../domain/jeune/jeune.milo'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { IdentiteJeuneQueryModel } from '../queries/query-models/jeunes.query-model'

export interface CreerJeuneMiloCommand extends Command {
  idPartenaire: string
  nom: string
  prenom: string
  email: string
  idConseiller: string
}

@Injectable()
export class CreerJeuneMiloCommandHandler extends CommandHandler<
  CreerJeuneMiloCommand,
  IdentiteJeuneQueryModel
> {
  constructor(
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(MiloJeuneRepositoryToken)
    private miloJeuneRepository: JeuneMilo.Repository,
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(AuthentificationRepositoryToken)
    private authentificationRepository: Authentification.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ChatRepositoryToken) private chatRepository: Chat.Repository,
    private jeuneFactory: Jeune.Factory
  ) {
    super('CreerJeuneMiloCommandHandler')
  }

  async handle(
    command: CreerJeuneMiloCommand
  ): Promise<Result<IdentiteJeuneQueryModel>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    const lowerCaseEmail = command.email.toLocaleLowerCase()
    const [jeuneByEmail, jeuneByIdDossier] = await Promise.all([
      this.jeuneRepository.getByEmail(lowerCaseEmail),
      this.jeuneRepository.getByIdPartenaire(command.idPartenaire)
    ])
    if (jeuneByEmail) {
      return failure(new EmailExisteDejaError(lowerCaseEmail))
    }
    if (jeuneByIdDossier) {
      return failure(new DossierExisteDejaError(command.idPartenaire))
    }

    const result = await this.miloJeuneRepository.creerJeune(
      command.idPartenaire
    )

    if (isFailure(result)) {
      return result
    }

    if (result.data.existeDejaChezMilo && result.data.idAuthentification) {
      const utilisateurMilo = await this.authentificationRepository.get(
        result.data.idAuthentification,
        Core.Structure.MILO,
        Authentification.Type.JEUNE
      )
      if (utilisateurMilo) {
        return failure(
          new MauvaiseCommandeError(
            'Utilisateur déjà créé, veuillez contacter le support.'
          )
        )
      }
    }
    const nouveauJeune = await this.creerLeJeune(
      command,
      lowerCaseEmail,
      conseiller
    )

    const utilisateur: Partial<Authentification.Utilisateur> = {
      id: nouveauJeune.id,
      idAuthentification: result.data.idAuthentification
    }
    await this.authentificationRepository.updateJeune(utilisateur)
    await this.chatRepository.initializeChatIfNotExists(
      nouveauJeune.id,
      conseiller.id
    )

    return success({
      id: nouveauJeune.id,
      prenom: nouveauJeune.firstName,
      nom: nouveauJeune.lastName
    })
  }

  async authorize(
    command: CreerJeuneMiloCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      !(
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.structure === Core.Structure.MILO
      )
    ) {
      return failure(new DroitsInsuffisants())
    }
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }

  private async creerLeJeune(
    command: CreerJeuneMiloCommand,
    lowerCaseEmail: string,
    conseiller: Conseiller
  ): Promise<Jeune> {
    const jeuneACreer: Jeune.Factory.ACreer = {
      nom: command.nom,
      prenom: command.prenom,
      email: lowerCaseEmail,
      structure: Core.Structure.MILO,
      conseiller,
      idPartenaire: command.idPartenaire
    }
    const nouveauJeune = this.jeuneFactory.creer(jeuneACreer)
    await this.jeuneRepository.save(nouveauJeune)
    return nouveauJeune
  }
}
