import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'

@Injectable()
export class FichierTelechargementAuthorizer {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idFichier: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      idFichier
    )
    if (fichierMetadata) {
      if (utilisateur.type === Authentification.Type.JEUNE) {
        if (fichierMetadata.idsJeunes.includes(utilisateur.id)) {
          return emptySuccess()
        }
      }
      if (utilisateur.type === Authentification.Type.CONSEILLER) {
        const jeunesDuFichier =
          await this.jeuneRepository.findAllJeunesByIdsAndConseiller(
            fichierMetadata.idsJeunes,
            utilisateur.id
          )
        const leConseillerADesJeunesDansLeFichier = jeunesDuFichier.length > 0
        if (
          leConseillerADesJeunesDansLeFichier ||
          fichierMetadata.idCreateur === utilisateur.id
        ) {
          return emptySuccess()
        }
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
