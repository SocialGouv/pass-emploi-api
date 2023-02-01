import { Inject, Injectable } from '@nestjs/common'
import { DateService } from '../../utils/date-service'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  NonTraitableError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Core } from '../../domain/core'
import {
  queryModelFromUtilisateur,
  UtilisateurQueryModel
} from '../queries/query-models/authentification.query-model'

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
    private dateService: DateService
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
      if (commandSanitized.structure === Core.Structure.PASS_EMPLOI) {
        return this.authentificationConseillerPassEmploi(commandSanitized)
      }
      if (commandSanitized.structure === Core.Structure.POLE_EMPLOI) {
        return this.authentificationConseillerSSO(commandSanitized)
      }
      if (commandSanitized.structure === Core.Structure.MILO) {
        return this.authentificationConseillerSSO(commandSanitized)
      }
    }
    if (commandSanitized.type === Authentification.Type.JEUNE) {
      if (commandSanitized.structure === Core.Structure.PASS_EMPLOI) {
        return this.authentificationJeunePassEmploi(commandSanitized)
      }
      if (commandSanitized.structure === Core.Structure.POLE_EMPLOI) {
        return this.authentificationJeunePoleEmploi(commandSanitized)
      }
      if (commandSanitized.structure === Core.Structure.MILO) {
        return this.authentificationJeuneMilo(commandSanitized)
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
    if (command.email) {
      const utilisateurInitial =
        await this.authentificationRepository.getJeuneByEmailEtStructure(
          command.email,
          command.structure
        )

      if (utilisateurInitial) {
        const maintenant = this.dateService.nowJs()
        const utilisateurMisAJour: Authentification.Utilisateur = {
          ...utilisateurInitial,
          id: utilisateurInitial.id,
          prenom: command.prenom ?? utilisateurInitial.prenom,
          nom: command.nom ?? utilisateurInitial.nom,
          structure: command.structure,
          type: Authentification.Type.JEUNE,
          roles: [],
          email: command.email ?? utilisateurInitial.email,
          dateDerniereConnexion: maintenant,
          datePremiereConnexion: maintenant,
          idAuthentification: command.idUtilisateurAuth
        }
        await this.authentificationRepository.update(utilisateurMisAJour)
        return success(queryModelFromUtilisateur(utilisateurMisAJour))
      }
    }
    return failure(
      new NonTraitableError('Utilisateur', command.idUtilisateurAuth)
    )
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

    return utilisateurMisAJour
  }

  private async authentificationConseillerPassEmploi(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve = await this.authentificationRepository.get(
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure,
      commandSanitized.type
    )
    if (!utilisateurTrouve) {
      return failure(
        new NonTrouveError('Utilisateur', commandSanitized.idUtilisateurAuth)
      )
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
    const utilisateurTrouve = await this.authentificationRepository.get(
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure,
      commandSanitized.type
    )
    if (!utilisateurTrouve) {
      return failure(
        new NonTraitableError('Utilisateur', commandSanitized.idUtilisateurAuth)
      )
    } else {
      const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
        utilisateurTrouve,
        commandSanitized
      )
      return success(queryModelFromUtilisateur(utilisateurMisAJour))
    }
  }

  private async authentificationJeunePoleEmploi(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve = await this.authentificationRepository.get(
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure,
      commandSanitized.type
    )
    if (!utilisateurTrouve) {
      return this.authentifierJeuneParEmail(commandSanitized)
    } else {
      const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
        utilisateurTrouve,
        commandSanitized
      )

      return success(queryModelFromUtilisateur(utilisateurMisAJour))
    }
  }

  private async authentificationJeunePassEmploi(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve = await this.authentificationRepository.get(
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure,
      commandSanitized.type
    )
    if (!utilisateurTrouve) {
      return failure(
        new NonTrouveError('Utilisateur', commandSanitized.idUtilisateurAuth)
      )
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
    const utilisateurTrouve = await this.authentificationRepository.get(
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure,
      commandSanitized.type
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
