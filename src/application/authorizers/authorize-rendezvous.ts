import { Inject, Injectable } from '@nestjs/common'
import { Conseiller, ConseillersRepositoryToken } from 'src/domain/conseiller'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
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
    private conseillerRepository: Conseiller.Repository
  ) {}

  async authorize(
    idRendezVous: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(idRendezVous)

    if (
      rendezVous &&
      utilisateur &&
      utilisateur.type === Authentification.Type.CONSEILLER
    ) {
      if (RendezVous.estUnTypeAnimationCollective(rendezVous.type)) {
        const conseiller = await this.conseillerRepository.get(utilisateur.id)

        if (
          conseiller &&
          rendezVous.idAgence &&
          rendezVous.idAgence === conseiller?.agence?.id
        ) {
          return emptySuccess()
        }
      } else if (
        rendezVous.jeunes.find(jeune => utilisateur.id === jeune.conseiller?.id)
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
