import { Inject, Injectable } from '@nestjs/common'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Conseiller } from '../../domain/conseiller'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetJeunesByConseillerQuery extends Query {
  idConseiller: Conseiller.Id
}

@Injectable()
export class GetJeunesByConseillerQueryHandler extends QueryHandler<
  GetJeunesByConseillerQuery,
  DetailJeuneQueryModel[]
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository
  ) {
    super()
  }

  handle(query: GetJeunesByConseillerQuery): Promise<DetailJeuneQueryModel[]> {
    return this.jeunesRepository.getAllQueryModelsByConseiller(
      query.idConseiller
    )
  }
  async authorize(query: GetJeunesByConseillerQuery): Promise<void> {
    if (query) {
    }
  }
}
