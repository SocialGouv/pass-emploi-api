import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Result,
  emptySuccess,
  failure,
  success
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Core } from '../../domain/core'
import {
  UtilisateurQueryModel,
  queryModelFromUtilisateur
} from './query-models/authentification.query-model'

export interface GetUtilisateurQuery extends Query {
  idAuthentification: string
  typeUtilisateur: Authentification.Type
  structureUtilisateur: Core.Structure
}

@Injectable()
export class GetUtilisateurQueryHandler extends QueryHandler<
  GetUtilisateurQuery,
  Result<UtilisateurQueryModel>
> {
  constructor(
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository
  ) {
    super('GetUtilisateurQueryHandler')
  }

  async handle(
    query: GetUtilisateurQuery
  ): Promise<Result<UtilisateurQueryModel>> {
    let utilisateur = undefined

    switch (query.typeUtilisateur) {
      case Authentification.Type.JEUNE: {
        utilisateur = await this.authentificationRepository.getJeuneByStructure(
          query.idAuthentification,
          query.structureUtilisateur
        )
        break
      }
      case Authentification.Type.CONSEILLER: {
        utilisateur = await this.authentificationRepository.getConseiller(
          query.idAuthentification
        )
        if (utilisateur?.structure !== query.structureUtilisateur) {
          utilisateur = undefined
        }
        break
      }
    }

    if (!utilisateur) {
      return failure(
        new NonTrouveError('Utilisateur', query.idAuthentification)
      )
    }

    return success(queryModelFromUtilisateur(utilisateur))
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
