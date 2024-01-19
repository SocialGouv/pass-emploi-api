import { Query } from '../../../building-blocks/types/query'
import { Injectable } from '@nestjs/common'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { Authentification } from '../../../domain/authentification'
import { MonSuiviQueryModel } from '../query-models/jeunes.milo.query-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import { DateTime } from 'luxon'
import { ActionQueryModel } from '../query-models/actions.query-model'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { Op } from 'sequelize'
import { fromSqlToActionQueryModel } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { fromSqlToRendezVousJeuneQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { GetSessionsJeuneMiloQueryGetter } from '../query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { buildError } from '../../../utils/logger.module'
import { SessionJeuneMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { estMilo } from '../../../domain/core'

export interface MonSuiviQuery extends Query {
  idJeune: string
  dateDebut: string
  dateFin: string
  accessToken: string
}

@Injectable()
export class MonSuiviQueryHandler extends QueryHandler<
  MonSuiviQuery,
  Result<MonSuiviQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private sessionsJeuneQueryGetter: GetSessionsJeuneMiloQueryGetter
  ) {
    super('MonSuiviQueryHandler')
  }
  async authorize(
    query: MonSuiviQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async handle(
    query: MonSuiviQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<MonSuiviQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: ConseillerSqlModel, required: true }]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    if (estMilo(utilisateur.structure) && !jeuneSqlModel.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(query.idJeune))
    }

    const dateDebut = DateTime.fromISO(query.dateDebut, {
      setZone: true
    })
    const dateFin = DateTime.fromISO(query.dateFin, {
      setZone: true
    })

    const [actions, rendezVous] = await Promise.all([
      this.recupererLesActions(query, dateDebut, dateFin),
      this.recupererLesRendezVous(query, dateDebut, dateFin, utilisateur.type)
    ])

    let sessionsMilo: SessionJeuneMiloQueryModel[] = []
    if (estMilo(utilisateur.structure)) {
      try {
        const sessionsQueryModels = await this.sessionsJeuneQueryGetter.handle(
          query.idJeune,
          jeuneSqlModel.idPartenaire!,
          query.accessToken,
          {
            periode: {
              debut: dateDebut,
              fin: dateFin
            },
            pourConseiller: false,
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

    return success({ actions, rendezVous, sessionsMilo })
  }

  async monitor(): Promise<void> {
    return
  }

  private async recupererLesActions(
    query: MonSuiviQuery,
    dateDebut: DateTime,
    dateFin: DateTime
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

    return actionsSqlModel.map(fromSqlToActionQueryModel)
  }

  private async recupererLesRendezVous(
    query: MonSuiviQuery,
    dateDebut: DateTime,
    dateFin: DateTime,
    typeUtilisateur: Authentification.Type
  ): Promise<RendezVousJeuneQueryModel[]> {
    const rendezVousSqlModel = await RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: query.idJeune },
          include: [ConseillerSqlModel]
        }
      ],
      where: {
        date: {
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lte]: dateFin.toJSDate()
        }
      },
      order: [['date', 'ASC']]
    })

    return rendezVousSqlModel.map(rdvSql =>
      fromSqlToRendezVousJeuneQueryModel(rdvSql, typeUtilisateur)
    )
  }
}
