import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Command } from '../../building-blocks/types/command'
import { failure, Result, success } from '../../building-blocks/types/result'
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
    private readonly authentificationRepository: Authentification.Repository
  ) {}

  async execute(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateur = await this.authentificationRepository.get(
      command.idUtilisateurAuth,
      command.type
    )

    if (!utilisateur) {
      return failure(
        new NonTrouveError('Utilisateur', command.idUtilisateurAuth)
      )
    }

    return success(utilisateur)
  }
}
