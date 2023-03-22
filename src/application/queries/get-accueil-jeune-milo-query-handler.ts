import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Action } from 'src/domain/action/action'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { AccueilJeuneQueryModel } from './query-models/jeunes.query-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

export interface GetAccueilJeuneMiloQuery extends Query {
  idJeune: string
  maintenant: string
}

@Injectable()
export class GetAccueilJeuneMiloQueryHandler extends QueryHandler<
  GetAccueilJeuneMiloQuery,
  Result<AccueilJeuneQueryModel>
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetAccueilJeuneMiloQueryHandler')
  }
  async handle(
    query: GetAccueilJeuneMiloQuery
  ): Promise<Result<AccueilJeuneQueryModel>> {
    const dateFinDeSemaine = DateTime.fromISO(query.maintenant, {
      setZone: true
    }).endOf('week')

    const maintenant = DateTime.fromISO(query.maintenant, {
      setZone: true
    })

    const [
      rendezVousModelsCount,
      rendezVousModelsProchainRdv,
      actionSqlModelsARealiser,
      actionSqlModelsEnRetard
    ] = await Promise.all([
      RendezVousSqlModel.count({
        where: {
          dateSuppression: null,
          date: { [Op.between]: [maintenant, dateFinDeSemaine] }
        },
        include: [
          {
            model: JeuneSqlModel,
            where: {
              id: query.idJeune
            }
          }
        ]
      }),
      RendezVousSqlModel.findOne({
        where: {
          dateSuppression: null,
          date: { [Op.gte]: maintenant }
        },
        order: [['date', 'ASC']],
        include: [
          {
            model: JeuneSqlModel,
            where: {
              id: query.idJeune
            },
            include: [ConseillerSqlModel]
          }
        ]
      }),
      ActionSqlModel.count({
        where: {
          id_jeune: query.idJeune,
          dateEcheance: { [Op.between]: [maintenant, dateFinDeSemaine] },
          statut: {
            [Op.in]: [Action.Statut.EN_COURS, Action.Statut.PAS_COMMENCEE]
          }
        }
      }),
      ActionSqlModel.count({
        where: {
          id_jeune: query.idJeune,
          dateEcheance: { [Op.lte]: maintenant },
          statut: {
            [Op.in]: [Action.Statut.EN_COURS, Action.Statut.PAS_COMMENCEE]
          }
        }
      })
    ])

    return success({
      dateDerniereMiseAJour: undefined,
      cetteSemaine: {
        nombreRendezVous: rendezVousModelsCount,
        nombreActionsDemarchesEnRetard: actionSqlModelsEnRetard,
        nombreActionsDemarchesARealiser: actionSqlModelsARealiser
      },
      prochainRendezVous: rendezVousModelsProchainRdv
        ? fromSqlToRendezVousJeuneQueryModel(
            rendezVousModelsProchainRdv,
            Authentification.Type.JEUNE,
            query.idJeune
          )
        : undefined,
      evenementsAVenir: [],
      mesAlertes: [],
      mesFavoris: []
    })
  }

  async authorize(
    query: GetAccueilJeuneMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.structure === Core.Structure.MILO) {
      return this.jeuneAuthorizer.authorizeJeune(query.idJeune, utilisateur)
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(): Promise<void> {
    return
  }
}
