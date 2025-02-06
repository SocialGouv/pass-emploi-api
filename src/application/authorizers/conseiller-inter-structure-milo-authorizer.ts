import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure,
  isSuccess
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller } from '../../domain/milo/conseiller'
import { ConseillerMiloRepositoryToken } from '../../domain/milo/conseiller.milo.db'
import {
  JeuneMilo,
  JeuneMiloRepositoryToken
} from '../../domain/milo/jeune.milo'

@Injectable()
export class ConseillerInterStructureMiloAuthorizer {
  constructor(
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    @Inject(JeuneMiloRepositoryToken)
    private jeuneRepository: JeuneMilo.Repository
  ) {}

  async autoriserConseillerPourUneStructureMilo(
    idStructureMilo: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseiller = await this.conseillerMiloRepository.get(utilisateur.id)

      if (
        isSuccess(conseiller) &&
        conseiller.data.structure.id === idStructureMilo
      ) {
        return emptySuccess()
      }
    }
    return failure(new DroitsInsuffisants())
  }

  async autoriserConseillerAvecLaMemeStructureQueLeJeune(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseillerMilo = await this.conseillerMiloRepository.get(
        utilisateur.id
      )

      if (isSuccess(conseillerMilo)) {
        const jeuneMilo = await this.jeuneRepository.get(idJeune)

        if (
          isSuccess(jeuneMilo) &&
          jeuneMilo.data.idStructureMilo === conseillerMilo.data.structure.id
        ) {
          return emptySuccess()
        }
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
