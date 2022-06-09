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
    const utilisateurConnu = await this.authentificationRepository.get(
      command.idUtilisateurAuth,
      command.structure,
      command.type
    )
    command.email = command.email?.toLocaleLowerCase()
    const estStructurePassEmploi =
      command.structure === Core.Structure.PASS_EMPLOI
    const estUnConseiller = command.type === Authentification.Type.CONSEILLER
    const estUnJeune = command.type === Authentification.Type.JEUNE
    const estUnJeuneAvecUnEmail = estUnJeune && command.email

    if (utilisateurConnu) {
      const utilisateurMisAJour = await this.miseAJourdeLUtilisateur(
        utilisateurConnu,
        command
      )
      return success(queryModelFromUtilisateur(utilisateurMisAJour))
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
      return this.creerNouveauConseiller(command)
    }

    if (estUnJeuneAvecUnEmail) {
      const jeuneCreeParConseillerPourPremiereConnexion =
        await this.authentificationRepository.getJeuneByEmail(command.email!)

      if (jeuneCreeParConseillerPourPremiereConnexion) {
        jeuneCreeParConseillerPourPremiereConnexion.nom =
          command.nom ?? jeuneCreeParConseillerPourPremiereConnexion.nom
        jeuneCreeParConseillerPourPremiereConnexion.prenom =
          command.prenom ?? jeuneCreeParConseillerPourPremiereConnexion.prenom

        await this.authentificationRepository.updateJeunePremiereConnexion(
          jeuneCreeParConseillerPourPremiereConnexion.id,
          jeuneCreeParConseillerPourPremiereConnexion.nom,
          jeuneCreeParConseillerPourPremiereConnexion.prenom,
          command.idUtilisateurAuth,
          this.dateService.nowJs()
        )
        return success(
          queryModelFromUtilisateur(jeuneCreeParConseillerPourPremiereConnexion)
        )
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

    const conseillerSso: Authentification.Utilisateur = result.data
    conseillerSso.dateDerniereConnexion = this.dateService.nowJs()
    await this.authentificationRepository.save(
      conseillerSso,
      this.dateService.nowJs()
    )

    return success(queryModelFromUtilisateur(conseillerSso))
  }

  private async miseAJourdeLUtilisateur(
    utilisateur: Authentification.Utilisateur,
    command: UpdateUtilisateurCommand
  ): Promise<Authentification.Utilisateur> {
    const utilisateurMisAJour: Authentification.Utilisateur = {
      ...utilisateur,
      email: command.email ?? utilisateur.email,
      idAuthentification: command.idUtilisateurAuth,
      nom: command.nom ?? utilisateur.nom,
      prenom: command.prenom ?? utilisateur.prenom,
      dateDerniereConnexion: this.dateService.nowJs()
    }

    await this.authentificationRepository.update(utilisateurMisAJour)
    return utilisateurMisAJour
  }
}
