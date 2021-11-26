import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-modelss'

export interface GetAllRendezVousJeune extends Query {
  idJeune: string
}

@Injectable()
export class GetAllRendezVousJeuneQueryHandler
  implements QueryHandler<GetAllRendezVousJeune, RendezVousQueryModel[]>
{
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {}

  async execute(query: GetAllRendezVousJeune): Promise<RendezVousQueryModel[]> {
    return this.rendezVousRepository.getAllQueryModelsByJeune(query.idJeune)
  }
}
