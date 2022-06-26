import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { RendezVous, RendezVousRepositoryToken } from 'src/domain/rendez-vous'

@Injectable()
export class RendezVousAuthorizer {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {}

  async authorize(
    idRendezVous: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(idRendezVous)

    if (
      rendezVous &&
      utilisateur &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      rendezVous.jeunes.find(jeune => utilisateur.id === jeune.conseiller?.id)
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
