import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Action, ActionsRepositoryToken } from '../../domain/action/action'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
import { Core } from '../../domain/core'

@Injectable()
export class ConseillerAgenceAuthorizer {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {}

  async authorizeConseillerDeLAgence(
    idAgence: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseiller = await this.conseillerRepository.get(utilisateur.id)

      if (conseiller?.agence?.id === idAgence) {
        return emptySuccess()
      }
    }
    return failure(new DroitsInsuffisants())
  }

  async authorizeConseillerDuJeuneOuSonAgence(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type == Authentification.Type.CONSEILLER) {
      const jeune = await this.jeuneRepository.get(idJeune)
      return this.authorizeConseillerDuJeuneOuSonAgenceMILO(utilisateur, jeune)
    }
    return failure(new DroitsInsuffisants())
  }

  async authorizeConseillerDeLActionDuJeuneOuSonAgence(
    idAction: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type == Authentification.Type.CONSEILLER) {
      const action = await this.actionRepository.get(idAction)
      if (action) {
        return this.authorizeConseillerDuJeuneOuSonAgence(
          action.idJeune,
          utilisateur
        )
      }
    }
    return failure(new DroitsInsuffisants())
  }

  async authorizeConseillerDuJeuneOuSonAgenceAvecPartageFavoris(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type == Authentification.Type.CONSEILLER) {
      const jeune = await this.jeuneRepository.get(idJeune)

      if (jeune && jeune.preferences.partageFavoris) {
        return this.authorizeConseillerDuJeuneOuSonAgenceMILO(
          utilisateur,
          jeune
        )
      }
    }
    return failure(new DroitsInsuffisants())
  }

  async authorizeConseillerMILOAvecUnJeuneDansLeRendezVous(
    idRendezVous: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      this.structureConseillerAutorisee(utilisateur.structure)
    ) {
      const rendezVous = await this.rendezVousRepository.get(idRendezVous)
      const conseillerUtilisateur = await this.conseillerRepository.get(
        utilisateur.id
      )

      if (rendezVous && conseillerUtilisateur) {
        if (
          rendezVous.jeunes.some(
            jeune => jeune.conseiller?.id === conseillerUtilisateur.id
          )
        ) {
          return emptySuccess()
        }

        if (
          conseillerUtilisateur?.agence &&
          rendezVous.jeunes.some(
            jeune =>
              jeune.conseiller?.idAgence === conseillerUtilisateur.agence!.id
          )
        ) {
          return emptySuccess()
        }
      }
    }
    return failure(new DroitsInsuffisants())
  }

  structureConseillerAutorisee(structure: Core.Structure): boolean {
    return [Core.Structure.MILO, Core.Structure.PASS_EMPLOI].includes(structure)
  }

  private async authorizeConseillerDuJeuneOuSonAgenceMILO(
    utilisateur: Authentification.Utilisateur,
    jeune?: Jeune
  ): Promise<Result> {
    if (jeune) {
      if (jeune.conseiller?.id === utilisateur.id) {
        return emptySuccess()
      }
      if (
        this.structureConseillerAutorisee(utilisateur.structure) &&
        jeune.conseiller?.idAgence
      ) {
        const conseillerUtilisateur = await this.conseillerRepository.get(
          utilisateur.id
        )
        if (
          conseillerUtilisateur &&
          conseillerUtilisateur.agence?.id === jeune.conseiller.idAgence
        ) {
          return emptySuccess()
        }
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
