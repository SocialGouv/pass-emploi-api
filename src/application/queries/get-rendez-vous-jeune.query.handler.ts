import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetAllRendezVousJeune extends Query {
  idJeune: string
}

@Injectable()
export class GetAllRendezVousJeuneQueryHandler extends QueryHandler<
  GetAllRendezVousJeune,
  RendezVousQueryModel[]
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {
    super()
  }

  async handle(query: GetAllRendezVousJeune): Promise<RendezVousQueryModel[]> {
    return this.rendezVousRepository.getAllQueryModelsByJeune(query.idJeune)
  }
  async authorize(query: GetAllRendezVousJeune): Promise<void> {
    if (query) {
    }
  }
}
