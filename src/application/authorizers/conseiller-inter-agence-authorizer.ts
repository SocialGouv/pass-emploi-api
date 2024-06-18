import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { estMilo } from '../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'

@Injectable()
export class ConseillerInterAgenceAuthorizer {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ActionRepositoryToken)
    private actionRepository: Action.Repository,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {}

  async autoriserConseillerPourUneAgence(
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

  async autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const jeune = await this.jeuneRepository.get(idJeune)
      return this.autoriserPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        utilisateur,
        jeune
      )
    }
    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMiloAvecPartageFavoris(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const jeune = await this.jeuneRepository.get(idJeune)

      if (jeune && jeune.preferences.partageFavoris) {
        return this.autoriserPourSonJeuneOuUnJeuneDeSonAgenceMilo(
          utilisateur,
          jeune
        )
      }
    }
    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerPourUneActionDeSonJeuneOuDUnJeuneDeSonAgenceMilo(
    idAction: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const action = await this.actionRepository.get(idAction)
      if (action) {
        return this.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
          action.idJeune,
          utilisateur
        )
      }
    }
    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerMiloPourUnRdvDeSonAgenceOuAvecUnJeuneDansLeRdv(
    idRendezVous: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      estMilo(utilisateur.structure)
    ) {
      const rendezVous = await this.rendezVousRepository.get(idRendezVous)
      const conseillerUtilisateur = await this.conseillerRepository.get(
        utilisateur.id
      )

      if (rendezVous && conseillerUtilisateur) {
        if (
          conseillerUtilisateur.agence &&
          conseillerUtilisateur.agence.id === rendezVous.idAgence
        ) {
          return emptySuccess()
        }

        if (
          rendezVous.jeunes.some(
            jeune => jeune.conseiller?.id === conseillerUtilisateur.id
          )
        ) {
          return emptySuccess()
        }

        if (
          conseillerUtilisateur.agence &&
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

  private async autoriserPourSonJeuneOuUnJeuneDeSonAgenceMilo(
    utilisateur: Authentification.Utilisateur,
    jeune?: Jeune
  ): Promise<Result> {
    if (jeune) {
      if (jeune.conseiller?.id === utilisateur.id) {
        return emptySuccess()
      }
      if (estMilo(utilisateur.structure) && jeune.conseiller?.idAgence) {
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
