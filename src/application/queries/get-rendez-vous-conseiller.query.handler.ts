import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { RendezVousConseillerQueryModel } from './query-models/rendez-vous.query-models'

export interface GetAllRendezVousConseiller extends Query {
  idConseiller: string
}

@Injectable()
export class GetAllRendezVousConseillerQueryHandler extends QueryHandler<
  GetAllRendezVousConseiller,
  RendezVousConseillerQueryModel
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository
  ) {
    super()
  }

  async handle(
    query: GetAllRendezVousConseiller
  ): Promise<RendezVousConseillerQueryModel> {
    return this.rendezVousRepository.getAllQueryModelsByConseiller(
      query.idConseiller
    )
  }
  async authorize(query: GetAllRendezVousConseiller): Promise<void> {
    if (query) {
    }
  }
}
