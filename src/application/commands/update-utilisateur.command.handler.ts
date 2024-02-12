import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  NonTraitableError,
  NonTraitableInexistantError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure,
  isFailure,
  success
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Core, estMilo } from '../../domain/core'
import { DateService } from '../../utils/date-service'
import {
  UtilisateurQueryModel,
  queryModelFromUtilisateur
} from '../queries/query-models/authentification.query-model'
import { MailBrevoService } from '../../infrastructure/clients/mail-brevo.service.db'
import { MailServiceToken } from '../../domain/mail'

export interface UpdateUtilisateurCommand extends Command {
  idUtilisateurAuth: string
  nom?: string
  prenom?: string
  email?: string
  type: Authentification.Type
  structure: Core.Structure
  federatedToken?: string
}

@Injectable()
export class UpdateUtilisateurCommandHandler extends CommandHandler<
  UpdateUtilisateurCommand,
  UtilisateurQueryModel
> {
  constructor(
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private authentificationFactory: Authentification.Factory,
    private dateService: DateService,
    @Inject(MailServiceToken)
    private mailBrevoService: MailBrevoService
  ) {
    super('UpdateUtilisateurCommandHandler')
  }

  async handle(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const commandSanitized: UpdateUtilisateurCommand = {
      ...command,
      email: command.email?.toLocaleLowerCase()
    }
    if (commandSanitized.type === Authentification.Type.CONSEILLER) {
      switch (commandSanitized.structure) {
        case Core.Structure.PASS_EMPLOI:
          return this.authentificationConseillerPassEmploi(commandSanitized)
        case Core.Structure.MILO:
        case Core.Structure.POLE_EMPLOI:
        case Core.Structure.POLE_EMPLOI_BRSA:
          return this.authentificationConseillerSSO(commandSanitized)
      }
    }
    if (commandSanitized.type === Authentification.Type.JEUNE) {
      switch (commandSanitized.structure) {
        case Core.Structure.PASS_EMPLOI:
          return this.authentificationJeunePassEmploi(commandSanitized)
        case Core.Structure.MILO:
          return this.authentificationJeuneMilo(commandSanitized)
        case Core.Structure.POLE_EMPLOI:
        case Core.Structure.POLE_EMPLOI_BRSA:
          return this.authentificationJeunePoleEmploi(commandSanitized)
      }
    }
    return failure(
      new NonTraitableError(
        "Type et structure de l'utilisateur non pris en charge.",
        command.idUtilisateurAuth
      )
    )
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  private async authentifierJeuneParEmail(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    if (!command.email) {
      return failure(
        new NonTraitableError('Utilisateur', command.idUtilisateurAuth)
      )
    }

    const utilisateurInitialTrouve =
      await this.authentificationRepository.getJeuneByEmail(command.email)

    if (!utilisateurInitialTrouve) {
      return failure(new NonTraitableInexistantError(command.idUtilisateurAuth))
    }
    const verificationUtilisateur = verifierStructureUtilisteur(
      utilisateurInitialTrouve,
      command.idUtilisateurAuth,
      command.structure
    )
    if (isFailure(verificationUtilisateur)) {
      return verificationUtilisateur
    }

    const maintenant = this.dateService.nowJs()
    const utilisateurMisAJour: Authentification.Utilisateur = {
      ...utilisateurInitialTrouve,
      id: utilisateurInitialTrouve.id,
      prenom: command.prenom ?? utilisateurInitialTrouve.prenom,
      nom: command.nom ?? utilisateurInitialTrouve.nom,
      structure: command.structure,
      type: Authentification.Type.JEUNE,
      roles: [],
      email: command.email ?? utilisateurInitialTrouve.email,
      dateDerniereConnexion: maintenant,
      datePremiereConnexion: maintenant,
      idAuthentification: command.idUtilisateurAuth
    }
    await this.authentificationRepository.update(utilisateurMisAJour)
    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }

  private async creerNouveauConseiller(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const result = this.authentificationFactory.buildConseiller(
      command.idUtilisateurAuth,
      command.nom,
      command.prenom,
      command.email,
      command.structure
    )

    if (isFailure(result)) {
      return result
    }

    const utilisateurConseiller: Authentification.Utilisateur = {
      ...result.data,
      dateDerniereConnexion: this.dateService.nowJs()
    }
    await this.authentificationRepository.save(
      utilisateurConseiller,
      this.dateService.nowJs()
    )

    if (estMilo(utilisateurConseiller.structure)) {
      await this.mailBrevoService.envoyerEmailCreationConseillerMilo(
        utilisateurConseiller
      )
    }
    return success(queryModelFromUtilisateur(utilisateurConseiller))
  }

  private async mettreAJourLUtilisateur(
    utilisateur: Authentification.Utilisateur,
    command: UpdateUtilisateurCommand
  ): Promise<Authentification.Utilisateur> {
    const maintenant = this.dateService.nowJs()
    const utilisateurMisAJour: Authentification.Utilisateur = {
      ...utilisateur,
      email: command.email ?? utilisateur.email,
      idAuthentification: command.idUtilisateurAuth,
      nom: command.nom ?? utilisateur.nom,
      prenom: command.prenom ?? utilisateur.prenom,
      dateDerniereConnexion: maintenant,
      datePremiereConnexion: utilisateur.datePremiereConnexion ?? maintenant
    }

    await this.authentificationRepository.update(utilisateurMisAJour)

    const estUnConseillerMilo =
      estMilo(utilisateur.structure) &&
      utilisateur.type === Authentification.Type.CONSEILLER

    if (estUnConseillerMilo) {
      const quiVientDeRemplirSonEmail = !utilisateur.email && command.email
      const dontLaDateDePremiereConnexionEstInferieureA30Jours =
        utilisateur.datePremiereConnexion &&
        DateService.isGreater(
          DateService.fromJSDateToDateTime(utilisateur.datePremiereConnexion)!,
          this.dateService.now().minus({ days: 30 })
        )

      if (
        quiVientDeRemplirSonEmail &&
        dontLaDateDePremiereConnexionEstInferieureA30Jours
      ) {
        await this.mailBrevoService.envoyerEmailCreationConseillerMilo(
          utilisateurMisAJour
        )
      }
    }

    return utilisateurMisAJour
  }

  private async authentificationConseillerPassEmploi(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getConseillerByStructure(
        commandSanitized.idUtilisateurAuth,
        commandSanitized.structure
      )
    if (!utilisateurTrouve) {
      return failure(new NonTrouveError(commandSanitized.idUtilisateurAuth))
    } else {
      const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
        utilisateurTrouve,
        commandSanitized
      )
      return success(queryModelFromUtilisateur(utilisateurMisAJour))
    }
  }
  private async authentificationJeuneMilo(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve = await this.authentificationRepository.getJeune(
      commandSanitized.idUtilisateurAuth
    )
    if (!utilisateurTrouve) {
      return failure(
        new NonTraitableInexistantError(commandSanitized.idUtilisateurAuth)
      )
    }
    const verificationStructureUtilisateur = verifierStructureUtilisteur(
      utilisateurTrouve,
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure
    )
    if (isFailure(verificationStructureUtilisateur)) {
      return verificationStructureUtilisateur
    }
    const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
      utilisateurTrouve,
      commandSanitized
    )
    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }

  private async authentificationJeunePoleEmploi(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve = await this.authentificationRepository.getJeune(
      commandSanitized.idUtilisateurAuth
    )

    if (!utilisateurTrouve) {
      return this.authentifierJeuneParEmail(commandSanitized)
    }
    const verificationUtilisateur = verifierStructureUtilisteur(
      utilisateurTrouve,
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure
    )
    if (isFailure(verificationUtilisateur)) {
      return verificationUtilisateur
    }

    const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
      utilisateurTrouve,
      commandSanitized
    )

    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }

  private async authentificationJeunePassEmploi(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getJeuneByStructure(
        commandSanitized.idUtilisateurAuth,
        commandSanitized.structure
      )
    if (!utilisateurTrouve) {
      return failure(new NonTrouveError(commandSanitized.idUtilisateurAuth))
    } else {
      const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
        utilisateurTrouve,
        commandSanitized
      )
      return success(queryModelFromUtilisateur(utilisateurMisAJour))
    }
  }

  private async authentificationConseillerSSO(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getConseillerByStructure(
        commandSanitized.idUtilisateurAuth,
        commandSanitized.structure
      )
    if (!utilisateurTrouve) {
      return this.creerNouveauConseiller(commandSanitized)
    } else {
      const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
        utilisateurTrouve,
        commandSanitized
      )
      return success(queryModelFromUtilisateur(utilisateurMisAJour))
    }
  }
}

function verifierStructureUtilisteur(
  utilisateurTrouve: Authentification.Utilisateur,
  idUtilisateur: string,
  structureAttendue: Core.Structure
): Result {
  if (utilisateurTrouve.structure !== structureAttendue) {
    const dejaConnecte = Boolean(utilisateurTrouve.datePremiereConnexion)
    let codeErreur = undefined

    switch (utilisateurTrouve.structure) {
      case Core.Structure.MILO:
        codeErreur = dejaConnecte
          ? NonTraitableError.CODE_UTILISATEUR_DEJA_MILO
          : NonTraitableError.CODE_UTILISATEUR_NOUVEAU_MILO
        break
      case Core.Structure.POLE_EMPLOI:
        codeErreur = dejaConnecte
          ? NonTraitableError.CODE_UTILISATEUR_DEJA_PE
          : NonTraitableError.CODE_UTILISATEUR_NOUVEAU_PE
        break
      case Core.Structure.POLE_EMPLOI_BRSA:
        codeErreur = dejaConnecte
          ? NonTraitableError.CODE_UTILISATEUR_DEJA_PE_BRSA
          : NonTraitableError.CODE_UTILISATEUR_NOUVEAU_PE_BRSA
        break
    }

    return failure(
      new NonTraitableError('Utilisateur', idUtilisateur, codeErreur)
    )
  }
  return emptySuccess()
}
