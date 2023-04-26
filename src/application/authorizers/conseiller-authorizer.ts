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
import { Core, estUtilisateurDeLaStructure } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'

@Injectable()
export class ConseillerAuthorizer {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}
  async autoriserLeConseiller(
    idConseiller: string,
    utilisateur: Authentification.Utilisateur,
    structuresAutorisees?: Core.Structure[]
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      estUtilisateurDeLaStructure(utilisateur, structuresAutorisees)
    ) {
      const conseiller = await this.conseillerRepository.get(idConseiller)

      if (conseiller && conseiller.id === utilisateur.id) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserLeConseillerPourSonJeune(
    idConseiller: string,
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseiller = await this.conseillerRepository.get(idConseiller)
      const jeune = await this.jeuneRepository.get(idJeune)

      if (
        conseiller &&
        conseiller.id === utilisateur.id &&
        jeune?.conseiller?.id === conseiller.id
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserToutConseiller(
    utilisateur: Authentification.Utilisateur,
    structuresAutorisees?: Core.Structure[]
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      estUtilisateurDeLaStructure(utilisateur, structuresAutorisees)
    ) {
      const conseiller = await this.conseillerRepository.get(utilisateur.id)

      if (conseiller) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerPourSonJeune(
    idJeune: string,
    utilisateur: Authentification.Utilisateur,
    structuresAutorisees?: Core.Structure[]
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      estUtilisateurDeLaStructure(utilisateur, structuresAutorisees)
    ) {
      const jeune = await this.jeuneRepository.get(idJeune)

      if (utilisateur.id === jeune?.conseiller?.id) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerPourSesJeunes(
    idsJeunes: string[],
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const jeunes = await this.jeuneRepository.findAllJeunesByIdsAndConseiller(
        idsJeunes,
        utilisateur.id
      )

      if (jeunes.length === idsJeunes.length) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerPourSesJeunesTransferes(
    idsJeunes: string[],
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const jeunes = await this.jeuneRepository.findAll(idsJeunes)

      for (const jeune of jeunes) {
        const estLeConseiller = jeune.conseiller?.id === utilisateur.id
        const estLeConseillerInitial =
          jeune.conseillerInitial?.id === utilisateur.id
        if (!(estLeConseiller || estLeConseillerInitial)) {
          return failure(new DroitsInsuffisants())
        }
      }
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerSuperviseur(
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseiller = await this.conseillerRepository.get(utilisateur.id)

      if (conseiller && Authentification.estSuperviseur(utilisateur)) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
