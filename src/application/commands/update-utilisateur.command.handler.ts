import { Inject, Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
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
import {
  queryModelFromUtilisateur,
  UtilisateurQueryModel
} from '../queries/query-models/authentification.query-models'

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
    const utilisateurConnu = await this.authentificationRepository.get(
      command.idUtilisateurAuth,
      command.structure,
      command.type
    )

    const lowerCaseEmail = command.email?.toLocaleLowerCase()
    const estStructurePassEmploi =
      command.structure === Core.Structure.PASS_EMPLOI
    const estUnConseiller = command.type === Authentification.Type.CONSEILLER
    const estUnJeune = command.type === Authentification.Type.JEUNE
    const estUnJeuneAvecUnEmail = estUnJeune && lowerCaseEmail

    if (utilisateurConnu) {
      await this.miseAJourdeLUtilisateurSiCestUnConseiller(
        lowerCaseEmail,
        utilisateurConnu,
        command.idUtilisateurAuth
      )
      return success(queryModelFromUtilisateur(utilisateurConnu))
    } else {
      if (estStructurePassEmploi) {
        return failure(
          new NonTrouveError('Utilisateur', command.idUtilisateurAuth)
        )
      }
    }

    // ******************************************
    // Première connexion
    // ******************************************

    if (estUnConseiller) {
      return this.creerNouveauConseiller(command, lowerCaseEmail)
    }

    if (estUnJeuneAvecUnEmail) {
      const jeune = await this.authentificationRepository.getJeuneByEmail(
        lowerCaseEmail
      )

      if (jeune) {
        await this.authentificationRepository.updateJeune(
          jeune.id,
          command.idUtilisateurAuth
        )
        return success(queryModelFromUtilisateur(jeune))
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

  private async creerNouveauConseiller(
    command: UpdateUtilisateurCommand,
    lowerCaseEmail?: string
  ): Promise<Result<UtilisateurQueryModel>> {
    const result = this.authentificationFactory.buildConseiller(
      command.nom,
      command.prenom,
      lowerCaseEmail,
      command.structure
    )

    if (isFailure(result)) {
      return result
    }

    const conseillerSso: Authentification.Utilisateur = result.data
    await this.authentificationRepository.save(
      conseillerSso,
      command.idUtilisateurAuth,
      this.dateService.nowJs()
    )

    return success(queryModelFromUtilisateur(conseillerSso))
  }

  private async miseAJourdeLUtilisateurSiCestUnConseiller(
    lowerCaseEmail: string | undefined,
    utilisateur: Authentification.Utilisateur,
    idUtilisateurAuth: string
  ): Promise<void> {
    if (
      lowerCaseEmail &&
      utilisateur.type === Authentification.Type.CONSEILLER
    ) {
      utilisateur.email = lowerCaseEmail
      await this.authentificationRepository.save(utilisateur, idUtilisateurAuth)
    }
  }
}
