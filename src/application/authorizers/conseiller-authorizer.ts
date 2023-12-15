import { Inject, Injectable } from '@nestjs/common'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { Core } from '../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import Structure = Core.Structure

@Injectable()
export class ConseillerAuthorizer {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}
  async autoriserLeConseiller(
    idConseiller: string,
    utilisateur: Authentification.Utilisateur,
    structureAutorisee = true
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      structureAutorisee
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
    structureAutorisee = true
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      structureAutorisee
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
    structureAutorisee = true
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      structureAutorisee
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

  async autoriserConseillerSuperviseurDeLEtablissement(
    utilisateur: Authentification.Utilisateur,
    idAgence: string
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseiller = await this.conseillerRepository.get(utilisateur.id)

      if (
        conseiller &&
        Authentification.estSuperviseur(utilisateur) &&
        conseiller.agence?.id === idAgence
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserLeConseillerExterne(
    idAuthentificationConseiller: string
  ): Promise<Result> {
    const conseiller = await this.conseillerRepository.getByIdAuthentification(
      idAuthentificationConseiller
    )
    if (!conseiller)
      return failure(
        new NonTrouveError(
          'Conseiller',
          'idAuthentification ' + idAuthentificationConseiller
        )
      )

    if (
      conseiller.structure !== Structure.POLE_EMPLOI &&
      conseiller.structure !== Structure.POLE_EMPLOI_BRSA
    )
      return failure(new DroitsInsuffisants())

    return emptySuccess()
  }
}
