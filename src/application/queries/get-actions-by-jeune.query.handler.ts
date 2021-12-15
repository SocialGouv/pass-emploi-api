import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { ActionQueryModel } from './query-models/actions.query-model'

export interface GetActionsByJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetActionsByJeuneQueryHandler extends QueryHandler<
  GetActionsByJeuneQuery,
  ActionQueryModel[]
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super()
  }

  async handle(query: GetActionsByJeuneQuery): Promise<ActionQueryModel[]> {
    return this.actionRepository.getQueryModelByJeuneId(query.idJeune)
  }
  async authorize(
    query: GetActionsByJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }
}
