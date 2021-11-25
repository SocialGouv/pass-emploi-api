import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { RendezVousConseillerQueryModel } from './query-models/rendez-vous.query-model'

export interface GetAllRendezVousConseiller extends Query {
  idConseiller: string
}

@Injectable()
export class GetAllRendezVousConseillerQueryHandler
  implements
    QueryHandler<GetAllRendezVousConseiller, RendezVousConseillerQueryModel>
{
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {}

  async execute(
    query: GetAllRendezVousConseiller
  ): Promise<RendezVousConseillerQueryModel> {
    return this.rendezVousRepository.getAllQueryModelsByConseiller(
      query.idConseiller
    )
  }
}
