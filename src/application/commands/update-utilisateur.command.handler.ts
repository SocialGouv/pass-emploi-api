import { Inject, Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
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
    const commandeSanitized: UpdateUtilisateurCommand = {
      ...command,
      email: command.email?.toLocaleLowerCase()
    }
    const utilisateurConnu = await this.authentificationRepository.get(
      commandeSanitized.idUtilisateurAuth,
      commandeSanitized.structure,
      commandeSanitized.type
    )

    if (!utilisateurConnu) {
      if (commandeSanitized.structure === Core.Structure.PASS_EMPLOI) {
        return failure(
          new NonTrouveError('Utilisateur', commandeSanitized.idUtilisateurAuth)
        )
      }
      if (commandeSanitized.type === Authentification.Type.CONSEILLER) {
        return this.creerNouveauConseiller(commandeSanitized)
      }
      if (
        commandeSanitized.type === Authentification.Type.JEUNE &&
        commandeSanitized.structure === Core.Structure.POLE_EMPLOI
      ) {
        return this.authentifierParEmail(commandeSanitized)
      }
      if (
        commandeSanitized.type === Authentification.Type.JEUNE &&
        commandeSanitized.structure === Core.Structure.MILO
      ) {
        return this.authentifierParEmail(commandeSanitized)
      }
    }

    const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
      utilisateurConnu!,
      commandeSanitized
    )
    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  private async authentifierParEmail(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    if (command.type === Authentification.Type.JEUNE && command.email) {
      const utilisateurInitial =
        await this.authentificationRepository.getJeuneByEmail(command.email)

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

    const conseillerSso: Authentification.Utilisateur = {
      ...result.data,
      dateDerniereConnexion: this.dateService.nowJs()
    }
    await this.authentificationRepository.save(
      conseillerSso,
      this.dateService.nowJs()
    )

    return success(queryModelFromUtilisateur(conseillerSso))
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
}
