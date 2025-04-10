import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  NonTraitableError,
  NonTraitableReason
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
import { Core, estMilo } from '../../domain/core'
import { MailServiceToken } from '../../domain/mail'
import { MailBrevoService } from '../../infrastructure/clients/mail-brevo.service.db'
import { DateService } from '../../utils/date-service'
import {
  queryModelFromUtilisateur,
  UtilisateurQueryModel
} from '../queries/query-models/authentification.query-model'

export type StructureUtilisateurAuth = Core.Structure | 'FRANCE_TRAVAIL'
export type TypeUtilisateurAuth = Authentification.Type | 'BENEFICIAIRE'

export interface UpdateUtilisateurCommand extends Command {
  idUtilisateurAuth: string
  nom?: string
  prenom?: string
  email?: string
  username?: string
  type: TypeUtilisateurAuth
  structure: StructureUtilisateurAuth
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

    switch (commandSanitized.type) {
      case Authentification.Type.CONSEILLER:
        return this.recupererConseiller(commandSanitized)
      case Authentification.Type.JEUNE:
      case 'BENEFICIAIRE':
        return this.recupererBeneficiaire(commandSanitized)
      case Authentification.Type.SUPPORT:
        return failure(
          new NonTraitableError(
            'Utilisateur',
            commandSanitized.idUtilisateurAuth,
            NonTraitableReason.TYPE_UTILISATEUR_NON_TRAITABLE
          )
        )
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  private recupererConseiller(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    switch (commandSanitized.structure) {
      case Core.Structure.MILO:
      case Core.Structure.POLE_EMPLOI:
      case Core.Structure.POLE_EMPLOI_BRSA:
      case Core.Structure.POLE_EMPLOI_AIJ:
      case Core.Structure.CONSEIL_DEPT:
      case Core.Structure.AVENIR_PRO:
      case Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF:
      case Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL:
      case Core.Structure.FT_EQUIP_EMPLOI_RECRUT:
        return this.recupererOuCreerUtilisateurConseiller(commandSanitized)
      case 'FRANCE_TRAVAIL':
        return this.recupererUtilisateurConseillerExistant(commandSanitized)
    }
  }

  private async recupererBeneficiaire(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    switch (commandSanitized.structure) {
      case Core.Structure.MILO:
        return this.authentificationJeuneMilo(commandSanitized)
      case Core.Structure.POLE_EMPLOI:
      case Core.Structure.POLE_EMPLOI_BRSA:
      case Core.Structure.POLE_EMPLOI_AIJ:
      case Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF:
      case Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL:
      case Core.Structure.FT_EQUIP_EMPLOI_RECRUT:
      case 'FRANCE_TRAVAIL':
        return this.authentificationBeneficiaireFT(commandSanitized)
      case Core.Structure.CONSEIL_DEPT:
      case Core.Structure.AVENIR_PRO:
        return failure(
          new NonTraitableError(
            'Utilisateur',
            commandSanitized.idUtilisateurAuth,
            NonTraitableReason.STRUCTURE_UTILISATEUR_NON_TRAITABLE
          )
        )
    }
  }

  private async authentifierJeuneParEmail(
    command: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    if (!command.email) {
      return failure(
        new NonTraitableError(
          'Utilisateur',
          command.idUtilisateurAuth,
          NonTraitableReason.EMAIL_BENEFICIAIRE_INTROUVABLE
        )
      )
    }

    const utilisateurInitialTrouve =
      await this.authentificationRepository.getJeuneByEmail(command.email)

    if (!utilisateurInitialTrouve) {
      return failure(
        new NonTraitableError(
          'Utilisateur',
          command.idUtilisateurAuth,
          NonTraitableReason.UTILISATEUR_INEXISTANT,
          command.email
        )
      )
    }
    const verificationUtilisateur = verifierStructureBeneficiaire(
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
      structure: utilisateurInitialTrouve.structure,
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
    const estSuperviseur =
      await this.authentificationRepository.estConseillerSuperviseur(
        command.structure as Core.Structure,
        command.email
      )

    const result = this.authentificationFactory.buildConseiller(
      command.idUtilisateurAuth,
      command.nom,
      command.prenom,
      command.email,
      command.username,
      command.structure as Core.Structure,
      estSuperviseur
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
      datePremiereConnexion: utilisateur.datePremiereConnexion ?? maintenant,
      username: command.username ?? utilisateur.username
    }

    await this.authentificationRepository.update(utilisateurMisAJour)

    const estUnConseillerMilo =
      estMilo(utilisateur.structure) &&
      Authentification.estConseiller(utilisateur.type)

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

  private async authentificationJeuneMilo(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getJeuneByIdAuthentification(
        commandSanitized.idUtilisateurAuth
      )
    if (!utilisateurTrouve) {
      return failure(
        new NonTraitableError(
          'Utilisateur',
          commandSanitized.idUtilisateurAuth,
          NonTraitableReason.UTILISATEUR_INEXISTANT,
          commandSanitized.email
        )
      )
    }
    const verificationStructureUtilisateur = verifierStructureBeneficiaire(
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

  private async authentificationBeneficiaireFT(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getJeuneByIdAuthentification(
        commandSanitized.idUtilisateurAuth
      )

    if (!utilisateurTrouve) {
      return this.authentifierJeuneParEmail(commandSanitized)
    }
    const verificationUtilisateur = verifierStructureBeneficiaire(
      utilisateurTrouve,
      commandSanitized.idUtilisateurAuth,
      commandSanitized.structure
    )
    if (isFailure(verificationUtilisateur)) {
      return verificationUtilisateur
    }

    const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
      utilisateurTrouve,
      { ...commandSanitized, structure: utilisateurTrouve.structure }
    )

    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }

  private async recupererOuCreerUtilisateurConseiller(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getConseiller(
        commandSanitized.idUtilisateurAuth
      )
    if (!utilisateurTrouve) {
      return this.creerNouveauConseiller(commandSanitized)
    }
    if (utilisateurTrouve.structure !== commandSanitized.structure) {
      const reason = reasonFromStructure(utilisateurTrouve.structure)
      return failure(
        new NonTraitableError(
          'Utilisateur',
          commandSanitized.idUtilisateurAuth,
          reason
        )
      )
    }

    const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
      utilisateurTrouve,
      commandSanitized
    )
    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }

  private async recupererUtilisateurConseillerExistant(
    commandSanitized: UpdateUtilisateurCommand
  ): Promise<Result<UtilisateurQueryModel>> {
    const utilisateurTrouve =
      await this.authentificationRepository.getConseiller(
        commandSanitized.idUtilisateurAuth
      )
    if (!utilisateurTrouve) {
      return failure(
        new NonTraitableError(
          'Utilisateur',
          commandSanitized.idUtilisateurAuth,
          NonTraitableReason.UTILISATEUR_INEXISTANT
        )
      )
    }

    const utilisateurMisAJour = await this.mettreAJourLUtilisateur(
      utilisateurTrouve,
      commandSanitized
    )
    return success(queryModelFromUtilisateur(utilisateurMisAJour))
  }
}

function verifierStructureBeneficiaire(
  utilisateurTrouve: Authentification.Utilisateur,
  idUtilisateur: string,
  structureAttendue: StructureUtilisateurAuth
): Result {
  // TODO : ne garder que cette partie pour FT quand le mobile sera en prod avec bouton unique FT
  if (structureAttendue === 'FRANCE_TRAVAIL') {
    return autoriseUtilisateurFTConnectOnly(utilisateurTrouve, idUtilisateur)
  }

  if (utilisateurTrouve.structure !== structureAttendue) {
    const reason = reasonFromStructure(utilisateurTrouve.structure)
    return failure(new NonTraitableError('Utilisateur', idUtilisateur, reason))
  }

  return emptySuccess()
}

function autoriseUtilisateurFTConnectOnly(
  utilisateurTrouve: Authentification.Utilisateur,
  idUtilisateur: string
): Result {
  switch (utilisateurTrouve.structure) {
    case Core.Structure.MILO:
      return failure(
        new NonTraitableError(
          'Utilisateur',
          idUtilisateur,
          NonTraitableReason.UTILISATEUR_DEJA_MILO
        )
      )
    case Core.Structure.POLE_EMPLOI:
    case Core.Structure.POLE_EMPLOI_AIJ:
    case Core.Structure.POLE_EMPLOI_BRSA:
    case Core.Structure.CONSEIL_DEPT:
    case Core.Structure.AVENIR_PRO:
    case Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL:
    case Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF:
    case Core.Structure.FT_EQUIP_EMPLOI_RECRUT:
      return emptySuccess()
  }
}

function reasonFromStructure(structure: Core.Structure): NonTraitableReason {
  switch (structure) {
    case Core.Structure.MILO:
      return NonTraitableReason.UTILISATEUR_DEJA_MILO
    case Core.Structure.POLE_EMPLOI:
      return NonTraitableReason.UTILISATEUR_DEJA_PE
    case Core.Structure.POLE_EMPLOI_BRSA:
      return NonTraitableReason.UTILISATEUR_DEJA_PE_BRSA
    case Core.Structure.POLE_EMPLOI_AIJ:
      return NonTraitableReason.UTILISATEUR_DEJA_PE_AIJ
    case Core.Structure.CONSEIL_DEPT:
      return NonTraitableReason.UTILISATEUR_DEJA_CONSEIL_DEPT
    case Core.Structure.AVENIR_PRO:
      return NonTraitableReason.UTILISATEUR_DEJA_AVENIR_PRO
    case Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF:
      return NonTraitableReason.UTILISATEUR_DEJA_ACCOMPAGNEMENT_INTENSIF
    case Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL:
      return NonTraitableReason.UTILISATEUR_DEJA_ACCOMPAGNEMENT_GLOBAL
    case Core.Structure.FT_EQUIP_EMPLOI_RECRUT:
      return NonTraitableReason.UTILISATEUR_DEJA_EQUIP_EMPLOI_RECRUT
  }
}
