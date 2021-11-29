import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { ResumeActionsDuJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetResumeActionsDesJeunesDuConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetResumeActionsDesJeunesDuConseillerQueryHandler
  implements
    QueryHandler<
      GetResumeActionsDesJeunesDuConseillerQuery,
      ResumeActionsDuJeuneQueryModel[]
    >
{
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository
  ) {}

  execute(
    query: GetResumeActionsDesJeunesDuConseillerQuery
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    return this.jeuneRepository.getResumeActionsDesJeunesDuConseiller(
      query.idConseiller
    )
  }
}
