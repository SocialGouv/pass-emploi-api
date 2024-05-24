import { Inject, Injectable } from '@nestjs/common'
import { RessourceIndisponibleError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ObjectStorageClient } from '../../infrastructure/clients/object-storage.client'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import {
  Fichier,
  FichierMetadata,
  FichierRepositoryToken
} from '../../domain/fichier'
import { FichierAuthorizer } from '../authorizers/fichier-authorizer'

export interface TelechargerFichierQuery extends Query {
  idFichier: string
}

type TelechargerFichierQueryModel = { metadata: FichierMetadata; url: string }

@Injectable()
export class TelechargerFichierQueryHandler extends QueryHandler<
  TelechargerFichierQuery,
  Result<TelechargerFichierQueryModel>
> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    private fichierTelechargementAuthorizer: FichierAuthorizer,
    private objectStorageClient: ObjectStorageClient,
    private evenementService: EvenementService
  ) {
    super('TelechargerFichierQueryHandler')
  }

  async authorize(
    query: TelechargerFichierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.fichierTelechargementAuthorizer.autoriserTelechargementDuFichier(
      query.idFichier,
      utilisateur
    )
  }

  async handle(
    query: TelechargerFichierQuery
  ): Promise<Result<TelechargerFichierQueryModel>> {
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

    return success({ metadata: fichierMetadata, url })
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    _: TelechargerFichierQuery,
    result: Result<TelechargerFichierQueryModel>
  ): Promise<void> {
    if (isFailure(result)) return
    if (Authentification.estJeune(utilisateur.type)) return // L'app gère l'envoie de l'événement

    switch (result.data.metadata.typeCreateur) {
      case Authentification.Type.JEUNE:
        return this.evenementService.creer(
          Evenement.Code.PIECE_JOINTE_BENEFICIAIRE_TELECHARGEE,
          utilisateur
        )
      case Authentification.Type.CONSEILLER:
        return this.evenementService.creer(
          Evenement.Code.PIECE_JOINTE_CONSEILLER_TELECHARGEE,
          utilisateur
        )
    }
  }
}
