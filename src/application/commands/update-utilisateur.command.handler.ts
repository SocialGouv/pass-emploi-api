import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { IdService } from 'src/utils/id-service'
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
    private readonly authentificationRepository: Authentification.Repository,
    private idService: IdService
  ) {}

  async execute(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    if (
      command.structure === Authentification.Structure.PASS_EMPLOI ||
      command.structure === Authentification.Structure.MILO
    ) {
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
        const utilisateur: Authentification.Utilisateur = {
          id: this.idService.generate(),
          prenom: command.prenom || '',
          nom: command.nom || '',
          email: command.email,
          type: command.type,
          structure: command.structure
        }

        await this.authentificationRepository.save(
          utilisateur,
          command.idUtilisateurAuth
        )
        return success(utilisateur)
      }
    }

    return failure(new NonTrouveError('Utilisateur', command.idUtilisateurAuth))
  }
}
