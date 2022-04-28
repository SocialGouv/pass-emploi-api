import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
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
  ): Promise<void> {
    const rendezVous = await this.rendezVousRepository.get(idRendezVous)

    if (
      rendezVous &&
      utilisateur &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      rendezVous.jeunes.find(jeune => utilisateur.id === jeune.conseiller?.id)
    ) {
      return
    }

    throw new Unauthorized('RendezVous')
  }
}
