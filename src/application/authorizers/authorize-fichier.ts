import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
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
  ): Promise<void> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      idFichier
    )
    if (fichierMetadata) {
      if (utilisateur.type === Authentification.Type.JEUNE) {
        if (fichierMetadata.idsJeunes.includes(utilisateur.id)) {
          return
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
          return
        }
      }
    }
    throw new Unauthorized('Fichier')
  }
}
