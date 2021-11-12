import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Conseiller,
  ConseillerEtSesJeunesQueryModel,
  ConseillersRepositoryToken
} from '../../domain/conseiller'

export interface GetConseillerEtSesJeunesQuery extends Query {
  idConseiller: Conseiller.Id
}

@Injectable()
export class GetConseillerEtSesJeunesQueryHandler
  implements
    QueryHandler<
      GetConseillerEtSesJeunesQuery,
      ConseillerEtSesJeunesQueryModel | undefined
    >
{
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository
  ) {}

  execute(
    query: GetConseillerEtSesJeunesQuery
  ): Promise<ConseillerEtSesJeunesQueryModel | undefined> {
    return this.conseillersRepository.getAvecJeunes(query.idConseiller)
  }
}
