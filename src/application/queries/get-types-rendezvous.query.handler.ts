import { Inject, Injectable } from '@nestjs/common'
import { RendezVous, RendezVousRepositoryToken } from 'src/domain/rendez-vous'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { TypesRendezVousQueryModel } from './query-models/rendez-vous.query-models'

@Injectable()
export class GetTypesRendezVousQueryHandler extends QueryHandler<
  Query,
  TypesRendezVousQueryModel
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {
    super('GetTypesRendezvousQueryHandler')
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: Query
  ): Promise<TypesRendezVousQueryModel> {
    return this.rendezVousRepository.getTypesRendezVousQueryModel()
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
