import { Query } from '../../../building-blocks/types/query'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { Authentification } from '../../../domain/authentification'
import { GetMonSuiviQueryModel } from '../query-models/jeunes.milo.query-model'
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
import { estMilo, estMiloPassEmploi } from '../../../domain/core'

export interface GetMonSuiviQuery extends Query {
  idJeune: string
  dateDebut: DateTime
  dateFin: DateTime
  accessToken: string
}

@Injectable()
export class GetMonSuiviQueryHandler extends QueryHandler<
  GetMonSuiviQuery,
  Result<GetMonSuiviQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private sessionsJeuneQueryGetter: GetSessionsJeuneMiloQueryGetter
  ) {
    super('GetMonSuiviQueryHandler')
  }
  async authorize(
    query: GetMonSuiviQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estMiloPassEmploi(utilisateur.structure)
    )
  }

  async handle(
    query: GetMonSuiviQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<GetMonSuiviQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: ConseillerSqlModel, required: true }]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    if (estMilo(utilisateur.structure) && !jeuneSqlModel.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(query.idJeune))
    }

    const [actions, rendezVous, sessionsMilo] = await Promise.all([
      this.recupererLesActions(query),
      this.recupererLesRendezVous(query, utilisateur.type),
      estMilo(utilisateur.structure)
        ? this.sessionsJeuneQueryGetter
            .handle(
              query.idJeune,
              jeuneSqlModel.idPartenaire!,
              query.accessToken,
              {
                periode: {
                  debut: query.dateDebut,
                  fin: query.dateFin
                },
                pourConseiller: false,
                filtrerEstInscrit: true
              }
            )
            .then(result => {
              if (isFailure(result)) {
                this.logger.error(`Erreur récupération Sessions Mon Suivi`)
                return null
              }
              return result.data
            })
            .catch(error => {
              if (error instanceof UnauthorizedException) {
                throw error
              }
              this.logger.error(
                buildError(`Erreur récupération Sessions Mon Suivi`, error)
              )
              return null
            })
        : null
    ])
    return success({ actions, rendezVous, sessionsMilo })
  }

  async monitor(): Promise<void> {
    return
  }

  private async recupererLesActions(
    query: GetMonSuiviQuery
  ): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.gte]: query.dateDebut.toJSDate(),
          [Op.lt]: query.dateFin.toJSDate()
        }
      },
      order: [['dateEcheance', 'ASC']]
    })

    return actionsSqlModel.map(fromSqlToActionQueryModel)
  }

  private async recupererLesRendezVous(
    query: GetMonSuiviQuery,
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
          [Op.gte]: query.dateDebut.toJSDate(),
          [Op.lte]: query.dateFin.toJSDate()
        }
      },
      order: [['date', 'ASC']]
    })

    return rendezVousSqlModel.map(rdvSql =>
      fromSqlToRendezVousJeuneQueryModel(rdvSql, typeUtilisateur)
    )
  }
}
