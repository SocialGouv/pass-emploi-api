import { Inject, Injectable } from '@nestjs/common'
import { RessourceIndisponibleError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ObjectStorageClient } from '../../infrastructure/clients/object-storage.client'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { FichierTelechargementAuthorizer } from '../authorizers/authorize-fichier-telechargement'

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
    private fichierTelechargementAuthorizer: FichierTelechargementAuthorizer,
    private objectStorageClient: ObjectStorageClient,
    private evenementService: EvenementService
  ) {
    super('TelechargerFichierQueryHandler')
  }

  async authorize(
    query: TelechargerFichierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.fichierTelechargementAuthorizer.authorize(
      query.idFichier,
      utilisateur
    )
  }

  async handle(query: TelechargerFichierQuery): Promise<Result<string>> {
    const fichierMetadata = (await this.fichierRepository.getFichierMetadata(
      query.idFichier
    ))!

    if (fichierMetadata.dateSuppression) {
      return failure(
        new RessourceIndisponibleError(
          `Le fichier ${query.idFichier} n'est plus disponible`
        )
      )
    }

    const url = await this.objectStorageClient.getUrlPresignee(fichierMetadata)

    return success(url)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.PIECE_JOINTE_TELECHARGEE,
      utilisateur
    )
  }
}
