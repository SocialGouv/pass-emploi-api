import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Unauthorized } from 'src/domain/erreur'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { ObjectStorageClient } from 'src/infrastructure/clients/object-storage.client'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'

export interface TelechargerFichierQuery extends Query {
  idFichier: string
}

@Injectable()
export class TelechargerFichierQueryHandler extends QueryHandler<
  TelechargerFichierQuery,
  Result<string>
> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private objectStorageClient: ObjectStorageClient
  ) {
    super('TelechargerFichierQueryHandler')
  }

  async authorize(
    query: TelechargerFichierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      query.idFichier
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

  async handle(query: TelechargerFichierQuery): Promise<Result<string>> {
    const fichierMetadata = (await this.fichierRepository.getFichierMetadata(
      query.idFichier
    ))!

    const url = await this.objectStorageClient.getUrlPresignee(fichierMetadata)

    return success(url)
  }

  async monitor(): Promise<void> {
    return
  }
}
