import { Injectable } from '@nestjs/common'

import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import {
  GetSessionsJeuneMiloQueryGetter,
  sessionsAvecInscriptionTriees
} from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Authentification } from 'src/domain/authentification'
import { estMilo, estMiloPassEmploi } from 'src/domain/core'

import { TYPES_ANIMATIONS_COLLECTIVES } from 'src/domain/rendez-vous/rendez-vous'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { GetFavorisAccueilQueryGetter } from 'src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from 'src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { GetCampagneQueryGetter } from 'src/application/queries/query-getters/get-campagne.query.getter'
import {
  fromSqlToRendezVousDetailJeuneQueryModel,
  fromSqlToRendezVousJeuneQueryModel
} from '../query-mappers/rendez-vous-milo.mappers'
import { AccueilJeuneMiloQueryModel } from '../query-models/jeunes.milo.query-model'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'

export interface GetAccueilJeuneMiloQuery extends Query {
  idJeune: string
  maintenant: string
  token: string
}

@Injectable()
export class GetAccueilJeuneMiloQueryHandler extends QueryHandler<
  GetAccueilJeuneMiloQuery,
  Result<AccueilJeuneMiloQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private getRecherchesSauvegardeesQueryGetter: GetRecherchesSauvegardeesQueryGetter,
    private getFavorisAccueilQueryGetter: GetFavorisAccueilQueryGetter,
    private getCampagneQueryGetter: GetCampagneQueryGetter
  ) {
    super('GetAccueilJeuneMiloQueryHandler')
  }
  async handle(
    query: GetAccueilJeuneMiloQuery,
    utilisateur: Authentification.Utilisateur
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
      favorisQueryModels,
      campagneQueryModel
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
      this.getFavorisAccueilQueryGetter.handle({ idJeune }),
      this.getCampagneQueryGetter.handle({ idJeune })
    ])

    let sessions
    if (estMilo(utilisateur.structure)) {
      if (!jeuneSqlModel.idPartenaire) {
        return failure(new JeuneMiloSansIdDossier(query.idJeune))
      }
      const sessionsQueryModels = await this.getSessionsQueryGetter.handle(
        jeuneSqlModel.idPartenaire,
        query.token,
        { debut: maintenant, fin: dateFinDeSemaine }
      )

      sessions = sessionsAvecInscriptionTriees(sessionsQueryModels)
    } else {
      sessions = sessionsAvecInscriptionTriees(success([]))
    }

    return success({
      cetteSemaine: {
        nombreRendezVous: rendezVousSqlModelsCount + sessions.length,
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
      prochaineSessionMilo: sessions[0],
      evenementsAVenir: evenementSqlModelAVenir.map(acSql =>
        fromSqlToRendezVousDetailJeuneQueryModel(
          acSql,
          idJeune,
          Authentification.Type.JEUNE
        )
      ),
      mesAlertes: recherchesQueryModels,
      mesFavoris: favorisQueryModels,
      campagne: campagneQueryModel
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
