import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { ResumeActionsDuJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetResumeActionsDesJeunesDuConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetResumeActionsDesJeunesDuConseillerQueryHandler extends QueryHandler<
  GetResumeActionsDesJeunesDuConseillerQuery,
  ResumeActionsDuJeuneQueryModel[]
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetResumeActionsDesJeunesDuConseillerQueryHandler')
  }

  handle(
    query: GetResumeActionsDesJeunesDuConseillerQuery
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    return this.jeuneRepository.getResumeActionsDesJeunesDuConseiller(
      query.idConseiller
    )
  }
  async authorize(
    query: GetResumeActionsDesJeunesDuConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
