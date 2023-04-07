import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Action } from 'src/domain/action/action'
import { JeuneAuthorizer } from '../../authorizers/authorize-jeune'
import { fromSqlToRendezVousJeuneQueryModel } from '../query-mappers/rendez-vous-milo.mappers'

import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { AccueilJeuneMiloQueryModel } from '../query-models/jeunes.milo.query-model'
import { GetRecherchesSauvegardeesQueryGetter } from '../query-getters/accueil/get-recherches-sauvegardees.query.getter.db'

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
    private getRecherchesSauvegardeesQueryGetter: GetRecherchesSauvegardeesQueryGetter
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

    const [
      rendezVousSqlModelsCount,
      rendezVousSqlModelsProchainRdv,
      actionSqlModelsARealiser,
      actionSqlModelsEnRetard,
      rechercheSqlModelsAlertes
    ] = await Promise.all([
      this.countRendezVousSemaine(maintenant, dateFinDeSemaine, idJeune),
      this.prochainRendezVous(maintenant, idJeune),
      this.countActionsDeLaSemaineARealiser(
        idJeune,
        maintenant,
        dateFinDeSemaine
      ),
      this.countActionsEnRetard(idJeune, maintenant),
      this.getRecherchesSauvegardeesQueryGetter.handle({
        idJeune
      })
    ])

    return success({
      dateDerniereMiseAJour: undefined,
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
      evenementsAVenir: [],
      mesAlertes: rechercheSqlModelsAlertes,
      mesFavoris: []
    })
  }

  async authorize(
    query: GetAccueilJeuneMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.structure === Core.Structure.MILO ||
      utilisateur.structure === Core.Structure.PASS_EMPLOI
    ) {
      return this.jeuneAuthorizer.authorizeJeune(query.idJeune, utilisateur)
    }
    return failure(new DroitsInsuffisants())
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
}
