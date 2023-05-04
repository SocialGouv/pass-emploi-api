import { Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, failure, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estMiloPassEmploi } from '../../../domain/core'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'

import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Action } from '../../../domain/action/action'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import {
  fromSqlToRendezVousDetailJeuneQueryModel,
  fromSqlToRendezVousJeuneQueryModel
} from '../query-mappers/rendez-vous-milo.mappers'

import { TYPES_ANIMATIONS_COLLECTIVES } from '../../../domain/rendez-vous/rendez-vous'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { GetFavorisAccueilQueryGetter } from '../query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from '../query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { AccueilJeuneMiloQueryModel } from '../query-models/jeunes.milo.query-model'

export interface GetAccueilJeuneMiloQuery extends Query {
  idJeune: string
  maintenant: string
}

@Injectable()
export class GetAccueilJeuneMiloQueryHandler extends QueryHandler<
  GetAccueilJeuneMiloQuery,
  Result<AccueilJeuneMiloQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private getRecherchesSauvegardeesQueryGetter: GetRecherchesSauvegardeesQueryGetter,
    private getFavorisAccueilQueryGetter: GetFavorisAccueilQueryGetter
  ) {
    super('GetAccueilJeuneMiloQueryHandler')
  }
  async handle(
    query: GetAccueilJeuneMiloQuery
  ): Promise<Result<AccueilJeuneMiloQueryModel>> {
    const maintenant = DateTime.fromISO(query.maintenant, {
      setZone: true
    })

    const dateFinDeSemaine = maintenant.endOf('week')
    const { idJeune } = query

    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: ConseillerSqlModel, required: true }]
    })

    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const [
      rendezVousSqlModelsCount,
      rendezVousSqlModelsProchainRdv,
      actionSqlModelsARealiser,
      actionSqlModelsEnRetard,
      evenementSqlModelAVenir,
      recherchesQueryModels,
      favorisQueryModels
    ] = await Promise.all([
      this.countRendezVousSemaine(maintenant, dateFinDeSemaine, idJeune),
      this.prochainRendezVous(maintenant, idJeune),
      this.countActionsDeLaSemaineARealiser(
        idJeune,
        maintenant,
        dateFinDeSemaine
      ),
      this.countActionsEnRetard(idJeune, maintenant),
      this.evenementsAVenir(jeuneSqlModel, maintenant),
      this.getRecherchesSauvegardeesQueryGetter.handle({
        idJeune
      }),
      this.getFavorisAccueilQueryGetter.handle({ idJeune })
    ])

    return success({
      cetteSemaine: {
        nombreRendezVous: rendezVousSqlModelsCount,
        nombreActionsDemarchesEnRetard: actionSqlModelsEnRetard,
        nombreActionsDemarchesARealiser: actionSqlModelsARealiser
      },
      prochainRendezVous: rendezVousSqlModelsProchainRdv
        ? fromSqlToRendezVousJeuneQueryModel(
            rendezVousSqlModelsProchainRdv,
            Authentification.Type.JEUNE,
            idJeune
          )
        : undefined,
      evenementsAVenir: evenementSqlModelAVenir.map(acSql =>
        fromSqlToRendezVousDetailJeuneQueryModel(
          acSql,
          idJeune,
          Authentification.Type.JEUNE
        )
      ),
      mesAlertes: recherchesQueryModels,
      mesFavoris: favorisQueryModels
    })
  }

  async authorize(
    query: GetAccueilJeuneMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estMiloPassEmploi(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }

  private countActionsEnRetard(
    idJeune: string,
    maintenant: DateTime
  ): Promise<number> {
    return ActionSqlModel.count({
      where: {
        id_jeune: idJeune,
        dateEcheance: { [Op.lte]: maintenant.toJSDate() },
        statut: {
          [Op.in]: [Action.Statut.EN_COURS, Action.Statut.PAS_COMMENCEE]
        }
      }
    })
  }

  private countActionsDeLaSemaineARealiser(
    idJeune: string,
    maintenant: DateTime,
    dateFinDeSemaine: DateTime
  ): Promise<number> {
    return ActionSqlModel.count({
      where: {
        id_jeune: idJeune,
        dateEcheance: {
          [Op.between]: [maintenant.toJSDate(), dateFinDeSemaine.toJSDate()]
        },
        statut: {
          [Op.in]: [Action.Statut.EN_COURS, Action.Statut.PAS_COMMENCEE]
        }
      }
    })
  }

  private prochainRendezVous(
    maintenant: DateTime,
    idJeune: string
  ): Promise<RendezVousSqlModel | null> {
    return RendezVousSqlModel.findOne({
      where: {
        dateSuppression: null,
        date: { [Op.gte]: maintenant.toJSDate() }
      },
      order: [['date', 'ASC']],
      include: [
        {
          model: JeuneSqlModel,
          where: {
            id: idJeune
          },
          include: [ConseillerSqlModel]
        }
      ]
    })
  }

  private async countRendezVousSemaine(
    maintenant: DateTime,
    dateFinDeSemaine: DateTime,
    idJeune: string
  ): Promise<number> {
    return RendezVousSqlModel.count({
      where: {
        dateSuppression: null,
        date: {
          [Op.between]: [maintenant.toJSDate(), dateFinDeSemaine.toJSDate()]
        }
      },
      include: [
        {
          model: JeuneSqlModel,
          where: {
            id: idJeune
          }
        }
      ]
    })
  }

  private evenementsAVenir(
    jeuneSqlModel: JeuneSqlModel,
    maintenant: DateTime
  ): Promise<RendezVousSqlModel[]> {
    return RendezVousSqlModel.findAll({
      where: {
        idAgence: jeuneSqlModel.conseiller?.idAgence,
        dateSuppression: null,
        date: { [Op.gte]: maintenant.toJSDate() },
        type: {
          [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
        }
      },
      order: [['date', 'ASC']],
      limit: 3
    })
  }
}
