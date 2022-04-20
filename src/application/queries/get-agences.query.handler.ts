import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { AgenceQueryModel } from './query-models/agence.query-models'
import { Agence, AgenceRepositoryToken } from '../../domain/agence'
import { Core } from '../../domain/core'
import Structure = Core.Structure
import { Authentification } from '../../domain/authentification'
import { Unauthorized } from '../../domain/erreur'

export interface GetAgenceQuery extends Query {
  structure: Structure
}

@Injectable()
export class GetAgencesQueryHandler extends QueryHandler<
  GetAgenceQuery,
  AgenceQueryModel[]
> {
  constructor(
    @Inject(AgenceRepositoryToken)
    private agencesRepository: Agence.Repository
  ) {
    super('GetAgencesQueryHandler')
  }

  async handle(query: GetAgenceQuery): Promise<AgenceQueryModel[]> {
    return this.agencesRepository.getAllQueryModelsByStructure(query.structure)
  }

  async authorize(
    query: GetAgenceQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.structure === query.structure
    ) {
      return
    }
    throw new Unauthorized('Agences')
  }

  async monitor(): Promise<void> {
    return
  }
}
