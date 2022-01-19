import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  NonTraitableError,
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
import { Core } from '../../domain/core'
import { UtilisateurQueryModel } from '../queries/query-models/authentification.query-models'
import { PlanificateurService } from '../../domain/planificateur'

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
    private planificateurService: PlanificateurService
  ) {
    super('UpdateUtilisateurCommandHandler')
  }

  async handle(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateur = await this.authentificationRepository.get(
      command.idUtilisateurAuth,
      command.structure,
      command.type
    )

    if (utilisateur) {
      return success(utilisateur)
    } else if (command.structure === Core.Structure.PASS_EMPLOI) {
      return failure(
        new NonTrouveError('Utilisateur', command.idUtilisateurAuth)
      )
    }

    const lowerCaseEmail = command.email?.toLocaleLowerCase()
    if (command.type === Authentification.Type.CONSEILLER) {
      const conseillerSso = this.authentificationFactory.buildConseiller(
        command.nom,
        command.prenom,
        lowerCaseEmail,
        command.structure
      )

      if (isFailure(conseillerSso)) {
        return conseillerSso
      }

      await this.authentificationRepository.save(
        conseillerSso.data,
        command.idUtilisateurAuth
      )

      this.planificateurService.planifierJobRappelMail(conseillerSso.data.id)

      return conseillerSso
    } else if (command.type === Authentification.Type.JEUNE && lowerCaseEmail) {
      const jeune = await this.authentificationRepository.getJeuneByEmail(
        lowerCaseEmail
      )

      if (jeune) {
        await this.authentificationRepository.updateJeune(
          jeune.id,
          command.idUtilisateurAuth
        )

        return success(jeune)
      }
    }

    return failure(
      new NonTraitableError('Utilisateur', command.idUtilisateurAuth)
    )
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: UpdateUtilisateurCommand
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
