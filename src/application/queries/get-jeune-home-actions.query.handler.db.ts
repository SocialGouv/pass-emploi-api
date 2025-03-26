import { Injectable } from '@nestjs/common'
import { Sequelize } from 'sequelize'
import { Action } from 'src/domain/action/action'
import { fromSqlToActionQueryModelWithJeune } from 'src/infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { peutVoirLesCampagnes } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { GetCampagneQueryGetter } from './query-getters/get-campagne.query.getter'
import { CampagneQueryModel } from './query-models/campagne.query-model'
import { JeuneHomeActionQueryModel } from './query-models/home-jeune.query-model'

export interface GetJeuneHomeActionsQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetJeuneHomeActionsQueryHandler extends QueryHandler<
  GetJeuneHomeActionsQuery,
  JeuneHomeActionQueryModel
> {
  constructor(
    private getCampagneQueryGetter: GetCampagneQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetJeuneHomeActionsQueryHandler')
  }

  async handle(
    query: GetJeuneHomeActionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<JeuneHomeActionQueryModel> {
    const getCampagne = (): Promise<CampagneQueryModel | undefined> =>
      peutVoirLesCampagnes(utilisateur.structure)
        ? this.getCampagneQueryGetter.handle(query)
        : Promise.resolve(undefined)

    const [actionsJeuneResult, campagne] = await Promise.all([
      this.recupererActionsDuBeneficiaire(query.idJeune),
      getCampagne()
    ])

    return {
      actions: actionsJeuneResult.map(fromSqlToActionQueryModelWithJeune),
      campagne
    }
  }

  async authorize(
    query: GetJeuneHomeActionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private async recupererActionsDuBeneficiaire(
    idJeune: string
  ): Promise<ActionSqlModel[]> {
    return ActionSqlModel.findAll({
      where: [{ id_jeune: idJeune }],
      order: [
        Sequelize.literal(
          `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
        ),
        ['date_derniere_actualisation', 'DESC']
      ],
      include: [{ model: JeuneSqlModel, required: true }]
    })
  }
}
