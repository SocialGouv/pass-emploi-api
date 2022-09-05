import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'

@Injectable()
export class FichierSuppressionAuthorizer {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository
  ) {}

  async authorize(
    idFichier: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      idFichier
    )
    if (fichierMetadata) {
      if (utilisateur.id === fichierMetadata.idCreateur) {
        return emptySuccess()
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
