import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  DossierExisteDejaError,
  EmailExisteDejaError,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import {
  Result,
  failure,
  isFailure,
  isSuccess,
  success
} from '../../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../../domain/chat'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../../domain/milo/conseiller'
import { Core, estMilo } from '../../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import {
  JeuneMilo,
  JeuneMiloRepositoryToken
} from '../../../domain/milo/jeune.milo'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { IdentiteJeuneQueryModel } from '../../queries/query-models/jeunes.query-model'

export interface CreerJeuneMiloCommand extends Command {
  idPartenaire: string
  nom: string
  prenom: string
  email: string
  idConseiller: string
  dispositif: Jeune.Dispositif.CEJ | Jeune.Dispositif.PACEA
  surcharge?: boolean
}

@Injectable()
export class CreerJeuneMiloCommandHandler extends CommandHandler<
  CreerJeuneMiloCommand,
  IdentiteJeuneQueryModel
> {
  constructor(
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(JeuneMiloRepositoryToken)
    private miloJeuneRepository: JeuneMilo.Repository,
    @Inject(JeuneRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(AuthentificationRepositoryToken)
    private authentificationRepository: Authentification.Repository,
    @Inject(ConseillerRepositoryToken)
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
      this.miloJeuneRepository.getByIdDossier(command.idPartenaire)
    ])
    if (jeuneByEmail) {
      return failure(new EmailExisteDejaError(lowerCaseEmail))
    }
    if (isSuccess(jeuneByIdDossier)) {
      return failure(new DossierExisteDejaError(command.idPartenaire))
    }

    const result = await this.miloJeuneRepository.creerJeune(
      command.idPartenaire,
      command.surcharge
    )

    if (isFailure(result)) {
      return result
    }

    if (result.data.existeDejaChezMilo && result.data.idAuthentification) {
      const utilisateurMilo =
        await this.authentificationRepository.getJeuneByStructure(
          result.data.idAuthentification,
          Core.Structure.MILO
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
    this.recupererStructure(nouveauJeune)
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
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur,
      estMilo(utilisateur.structure)
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
      idPartenaire: command.idPartenaire,
      dispositif: command.dispositif
    }

    const nouveauJeune = this.jeuneFactory.creer(jeuneACreer)
    await this.jeuneRepository.save(nouveauJeune)
    return nouveauJeune
  }

  private async recupererStructure(jeune: Jeune): Promise<void> {
    try {
      const resultDossier = await this.miloJeuneRepository.getDossier(
        jeune.idPartenaire!
      )
      if (isSuccess(resultDossier)) {
        const codeStructure = resultDossier.data.codeStructure
        await this.miloJeuneRepository.save(jeune, codeStructure)
      }
    } catch (e) {
      this.logger.warn(e)
    }
  }
}
