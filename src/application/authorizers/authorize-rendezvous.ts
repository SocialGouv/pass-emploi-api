import { Inject, Injectable } from '@nestjs/common'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
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
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'

@Injectable()
export class RendezVousAuthorizer {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idRendezVous: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(idRendezVous)

    if (!rendezVous) {
      return failure(new NonTrouveError('RendezVous', idRendezVous))
    }

    if (!utilisateur) {
      return failure(new DroitsInsuffisants())
    }

    switch (utilisateur.type) {
      case Authentification.Type.JEUNE:
        return this.autoriserUnJeune(rendezVous, utilisateur)
      case Authentification.Type.CONSEILLER:
        return this.autoriserUnConseiller(rendezVous, utilisateur)
      default:
        return failure(new DroitsInsuffisants())
    }
  }

  async authorizeConseiller(
    idRendezVous: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(idRendezVous)

    if (!rendezVous) {
      return failure(new NonTrouveError('RendezVous', idRendezVous))
    }

    if (!utilisateur) {
      return failure(new DroitsInsuffisants())
    }
    return this.autoriserUnConseiller(rendezVous, utilisateur)
  }

  private async autoriserUnJeune(
    rendezVous: RendezVous,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (RendezVous.estUnTypeAnimationCollective(rendezVous.type)) {
      const jeune = await this.jeuneRepository.get(utilisateur.id)

      if (
        jeune &&
        rendezVous.idAgence &&
        rendezVous.idAgence === jeune.conseiller?.idAgence
      ) {
        return emptySuccess()
      }
    } else if (rendezVous.jeunes.find(jeune => utilisateur.id === jeune.id)) {
      return emptySuccess()
    }
    return failure(new DroitsInsuffisants())
  }

  private async autoriserUnConseiller(
    rendezVous: RendezVous,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    // RETRO COMPATIBILITÉ : A SUPPRIMER QUAND TOUTES LES ANIMATIONS COLLECTIVES AURONT UN ID AGENCE
    if (
      RendezVous.estUnTypeAnimationCollective(rendezVous.type) &&
      rendezVous.idAgence
    ) {
      const conseiller = await this.conseillerRepository.get(utilisateur.id)

      if (!conseiller) {
        return failure(new DroitsInsuffisants())
      }
      if (rendezVous.idAgence === conseiller?.agence?.id) {
        return emptySuccess()
      }
    } else if (
      rendezVous.jeunes.find(jeune => utilisateur.id === jeune.conseiller?.id)
    ) {
      return emptySuccess()
    }
    return failure(new DroitsInsuffisants())
  }
}
