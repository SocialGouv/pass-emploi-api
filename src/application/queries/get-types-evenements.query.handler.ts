import { Inject, Injectable } from '@nestjs/common'
import { RendezVous, RendezVousRepositoryToken } from 'src/domain/rendez-vous'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { TypesEvenementsQueryModel } from './query-models/rendez-vous.query-models'

@Injectable()
export class GetTypesEvenementsQueryHandler extends QueryHandler<
  Query,
  TypesEvenementsQueryModel
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {
    super('GetTypesEvenementsQueryHandler')
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: Query
  ): Promise<TypesEvenementsQueryModel> {
    return this.rendezVousRepository.getTypesEvenementsQueryModel()
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: Query
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
