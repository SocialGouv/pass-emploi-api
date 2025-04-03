import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Authentification } from 'src/domain/authentification'
import { fromSqlToActionQueryModelWithJeune } from 'src/infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { estMilo } from '../../domain/core'
import { RendezVousJeuneAssociationSqlModel } from '../../infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { buildError } from '../../utils/logger.module'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { ActionQueryModel } from './query-models/actions.query-model'
import { JeuneHomeAgendaQueryModel } from './query-models/home-jeune-suivi.query-model'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'
import { SessionJeuneMiloQueryModel } from './query-models/sessions.milo.query.model'
import estConseiller = Authentification.estConseiller

export interface GetJeuneHomeAgendaQuery extends Query {
  idJeune: string
  maintenant: string
  accessToken: string
}

@Injectable()
export class GetJeuneHomeAgendaQueryHandler extends QueryHandler<
  GetJeuneHomeAgendaQuery,
  Result<JeuneHomeAgendaQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private getSessionsJeuneQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
    private configuration: ConfigService
  ) {
    super('GetJeuneHomeAgendaQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<JeuneHomeAgendaQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: ConseillerSqlModel, required: true }]
    })
    if (!jeuneSqlModel || !jeuneSqlModel.conseiller) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const maintenant = DateTime.fromISO(query.maintenant, {
      setZone: true
    })
    const { lundiDernier, dimancheEnHuit } =
      this.recupererLesDatesEntreLundiDernierEtDeuxSemainesPlusTard(maintenant)
    const [actions, rendezVous, actionsEnRetard] = await Promise.all([
      this.recupererLesActions(
        query,
        lundiDernier,
        dimancheEnHuit,
        jeuneSqlModel
      ),
      this.recupererLesRendezVous(
        query,
        lundiDernier,
        dimancheEnHuit,
        utilisateur.type,
        jeuneSqlModel
      ),
      this.recupererLeNombreDactionsEnRetard(query, maintenant)
    ])

    let sessionsMilo: SessionJeuneMiloQueryModel[] = []
    const jeuneStructureDifferenteConseiller =
      estConseiller(utilisateur.type) &&
      jeuneSqlModel.idStructureMilo !==
        jeuneSqlModel.conseiller?.idStructureMilo
    if (estMilo(utilisateur.structure) && !jeuneStructureDifferenteConseiller) {
      if (!jeuneSqlModel.idPartenaire) {
        return failure(new JeuneMiloSansIdDossier(query.idJeune))
      }

      try {
        const sessionsQueryModels =
          await this.getSessionsJeuneQueryGetter.handle(
            query.idJeune,
            jeuneSqlModel.idPartenaire,
            query.accessToken,
            {
              periode: {
                debut: lundiDernier,
                fin: dimancheEnHuit
              },
              pourConseiller: Authentification.estConseiller(utilisateur.type),
              filtrerEstInscrit: true
            }
          )
        if (isFailure(sessionsQueryModels)) {
          return sessionsQueryModels
        }
        sessionsMilo = sessionsQueryModels.data
      } catch (e) {
        this.logger.error(
          buildError(
            `La récupération des sessions de l'agenda du jeune ${query.idJeune} a échoué`,
            e
          )
        )
      }
    }

    return success({
      actions,
      rendezVous,
      sessionsMilo,
      metadata: {
        actionsEnRetard: actionsEnRetard,
        dateDeDebut: lundiDernier.toJSDate(),
        dateDeFin: dimancheEnHuit.toJSDate()
      }
    })
  }

  async authorize(
    query: GetJeuneHomeAgendaQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estConseiller(utilisateur.type)) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private recupererLesDatesEntreLundiDernierEtDeuxSemainesPlusTard(
    maintenant: DateTime
  ): {
    lundiDernier: DateTime
    dimancheEnHuit: DateTime
  } {
    const dateDebut = maintenant.startOf('week')
    const dimancheEnHuit = dateDebut.plus({ day: 13 }).endOf('day')
    return { lundiDernier: dateDebut, dimancheEnHuit: dimancheEnHuit }
  }

  private async recupererLesRendezVous(
    query: GetJeuneHomeAgendaQuery,
    dateDebut: DateTime,
    dateFin: DateTime,
    typeUtilisateur: Authentification.Type,
    jeuneSqlModel: JeuneSqlModel
  ): Promise<RendezVousJeuneQueryModel[]> {
    const rdvsDuJeune = await RendezVousJeuneAssociationSqlModel.findAll({
      where: {
        idJeune: query.idJeune
      }
    })
    const rendezVousSqlModel = await RendezVousSqlModel.findAll({
      where: {
        // TODO réecrire en SQL RAW avec une jointure
        id: rdvsDuJeune.map(rdvAssoc => rdvAssoc.idRendezVous),
        date: {
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lte]: dateFin.toJSDate()
        }
      },
      order: [['date', 'ASC']]
    })

    return rendezVousSqlModel.map(rdvSql =>
      fromSqlToRendezVousJeuneQueryModel(
        rdvSql,
        typeUtilisateur,
        query.idJeune,
        jeuneSqlModel
      )
    )
  }

  private async recupererLesActions(
    query: GetJeuneHomeAgendaQuery,
    dateDebut: DateTime,
    dateFin: DateTime,
    jeuneSqlModel: JeuneSqlModel
  ): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lt]: dateFin.toJSDate()
        }
      },
      order: [['dateEcheance', 'ASC']]
    })

    return actionsSqlModel.map(actionSqlModel =>
      fromSqlToActionQueryModelWithJeune({
        ...actionSqlModel.dataValues,
        jeune: jeuneSqlModel
      } as ActionSqlModel)
    )
  }

  private async recupererLeNombreDactionsEnRetard(
    query: GetJeuneHomeAgendaQuery,
    maintenant: DateTime
  ): Promise<number> {
    return ActionSqlModel.count({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.lt]: maintenant.startOf('day').toJSDate()
        },
        statut: {
          [Op.notIn]: [Action.Statut.ANNULEE, Action.Statut.TERMINEE]
        }
      }
    })
  }
}
