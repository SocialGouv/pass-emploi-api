import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { ObjectStorageClient } from 'src/infrastructure/clients/object-storage.client'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { FichierAuthorizer } from '../authorizers/authorize-fichier'

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
    private fichierAuthorizer: FichierAuthorizer,
    private objectStorageClient: ObjectStorageClient
  ) {
    super('TelechargerFichierQueryHandler')
  }

  async authorize(
    query: TelechargerFichierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.fichierAuthorizer.authorize(query.idFichier, utilisateur)
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
