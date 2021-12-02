import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
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
import { UtilisateurQueryModel } from '../queries/query-models/authentification.query-models'

export interface UpdateUtilisateurCommand extends Command {
  idUtilisateurAuth: string
  nom?: string
  prenom?: string
  email?: string
  type: Authentification.Type
  structure: Authentification.Structure
  federatedToken?: string
}

@Injectable()
export class UpdateUtilisateurCommandHandler {
  constructor(
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private authentificationFactory: Authentification.Factory
  ) {}

  async execute(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateur = await this.authentificationRepository.get(
      command.idUtilisateurAuth,
      command.type
    )

    if (utilisateur) {
      return success(utilisateur)
    }

    if (
      command.structure === Authentification.Structure.MILO &&
      command.type === Authentification.Type.CONSEILLER
    ) {
      const result = this.authentificationFactory.buildConseillerMilo(
        command.nom,
        command.prenom,
        command.email
      )

      if (isFailure(result)) {
        return result
      }

      await this.authentificationRepository.save(
        result.data,
        command.idUtilisateurAuth
      )
      return result
    }

    return failure(new NonTrouveError('Utilisateur', command.idUtilisateurAuth))
  }
}
