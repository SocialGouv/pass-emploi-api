import { Inject, Injectable } from '@nestjs/common'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { ListeDeDiffusionAuthorizer } from 'src/application/authorizers/liste-de-diffusion-authorizer'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'

@Injectable()
export class FichierAuthorizer {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private listeDiffusionAuthorizer: ListeDeDiffusionAuthorizer
  ) {}

  async autoriserTeleversementDuFichier(
    utilisateur: Authentification.Utilisateur,
    idsJeunes?: string[],
    idsListeDiffusion?: string[]
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.JEUNE) return emptySuccess()

    if (idsJeunes?.length) {
      const resultJeunes =
        await this.conseillerAuthorizer.autoriserConseillerPourSesJeunes(
          idsJeunes,
          utilisateur
        )
      if (isFailure(resultJeunes)) return resultJeunes
    }

    if (idsListeDiffusion?.length) {
      for (const idListe of idsListeDiffusion) {
        const result =
          await this.listeDiffusionAuthorizer.autoriserConseillerPourSaListeDeDiffusion(
            idListe,
            utilisateur
          )
        if (isFailure(result)) {
          return result
        }
      }
    }

    return emptySuccess()
  }

  async autoriserTelechargementDuFichier(
    idFichier: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      idFichier
    )

    if (fichierMetadata) {
      if (fichierMetadata.idCreateur === utilisateur.id) return emptySuccess()

      if (
        utilisateur.type === Authentification.Type.JEUNE &&
        fichierMetadata.idsJeunes.includes(utilisateur.id)
      )
        return emptySuccess()

      if (utilisateur.type === Authentification.Type.CONSEILLER) {
        const jeunesDuConseiller =
          await this.jeuneRepository.findAllJeunesByConseiller(utilisateur.id)
        const idsJeunesDuConseiller = jeunesDuConseiller.map(({ id }) => id)

        if (
          fichierMetadata.typeCreateur === Authentification.Type.JEUNE &&
          idsJeunesDuConseiller.includes(fichierMetadata.idCreateur)
        )
          return emptySuccess()

        if (fichierMetadata.typeCreateur === Authentification.Type.CONSEILLER) {
          const leConseillerADesJeunesDansLeFichier =
            fichierMetadata.idsJeunes.some(idJeuneDuFichier =>
              idsJeunesDuConseiller.includes(idJeuneDuFichier)
            )
          if (leConseillerADesJeunesDansLeFichier) return emptySuccess()
        }
      }
    }

    return failure(new DroitsInsuffisants())
  }

  async autoriserSuppressionDuFichier(
    idFichier: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      idFichier
    )
    if (fichierMetadata && utilisateur.id === fichierMetadata.idCreateur)
      return emptySuccess()

    return failure(new DroitsInsuffisants())
  }
}
