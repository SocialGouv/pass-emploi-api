import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Fichier, FichierRepositoryToken } from 'src/domain/fichier'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'

@Injectable()
export class FichierAuthorizer {
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
          await this.jeuneRepository.findAllJeunesByConseiller(
            fichierMetadata.idsJeunes,
            utilisateur.id
          )
        const leConseillerADesJeunesDansLeFichier = jeunesDuFichier.length > 0
        if (leConseillerADesJeunesDansLeFichier) {
          return emptySuccess()
        }
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
