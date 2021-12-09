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
import Structure = Authentification.Structure

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
      command.structure,
      command.type
    )

    if (utilisateur) {
      return success(utilisateur)
    } else if (command.structure === Structure.PASS_EMPLOI) {
      return failure(
        new NonTrouveError('Utilisateur', command.idUtilisateurAuth)
      )
    }

    if (command.type === Authentification.Type.CONSEILLER) {
      const conseillerSso = this.authentificationFactory.buildConseiller(
        command.nom,
        command.prenom,
        command.email,
        command.structure
      )

      if (isFailure(conseillerSso)) {
        return conseillerSso
      }

      await this.authentificationRepository.save(
        conseillerSso.data,
        command.idUtilisateurAuth
      )
      return conseillerSso
    } else if (command.type === Authentification.Type.JEUNE && command.email) {
      const jeuneMilo =
        await this.authentificationRepository.getJeuneMiloByEmail(command.email)

      if (jeuneMilo) {
        await this.authentificationRepository.updateJeuneMilo(
          jeuneMilo.id,
          command.idUtilisateurAuth
        )

        return success(jeuneMilo)
      }
    }

    return failure(new NonTrouveError('Utilisateur', command.idUtilisateurAuth))
  }
}
