import { Inject, Injectable } from '@nestjs/common'
import { Op, Order, QueryTypes, Sequelize, WhereOptions } from 'sequelize'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Action } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { fromSqlToActionQueryModel } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { ActionQueryModel } from '../query-models/actions.query-model'

const OFFSET_PAR_DEFAUT = 0
const LIMITE_NOMBRE_ACTIONS_PAR_PAGE = 10

export interface GetActionsJeuneQuery extends Query {
  idJeune: string
  page?: number
  tri?: Action.Tri
  statuts?: Action.Statut[]
  etats?: Action.Qualification.Etat[]
}

export interface ActionsJeuneQueryModel {
  actions: ActionQueryModel[]
  metadonnees: {
    nombreTotal: number
    nombrePasCommencees: number
    nombreEnCours: number
    nombreTerminees: number
    nombreAnnulees: number
    nombreNonQualifiables: number
    nombreAQualifier: number
    nombreQualifiees: number
    nombreActionsParPage: number
  }
}

@Injectable()
export class GetActionsJeuneQueryHandler extends QueryHandler<
  GetActionsJeuneQuery,
  Result<ActionsJeuneQueryModel>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetActionsJeuneQueryHandler')
  }

  async handle(
    query: GetActionsJeuneQuery
  ): Promise<Result<ActionsJeuneQueryModel>> {
    const filtres = generateWhere(query)

    const [nombreTotalActionsFiltrees, statutRawCount] = await Promise.all([
      ActionSqlModel.count({ where: filtres }),
      this.compterActionsParStatut(query.idJeune)
    ])

    if (!laPageExiste(nombreTotalActionsFiltrees, query.page)) {
      return failure(new NonTrouveError('Page', query.page?.toString()))
    }

    const result: ActionsJeuneQueryModel = {
      actions: [],
      metadonnees: {
        nombreTotal: this.compterToutesLesActions(statutRawCount),
        nombrePasCommencees: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.PAS_COMMENCEE
        ),
        nombreEnCours: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.EN_COURS
        ),
        nombreTerminees: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.TERMINEE
        ),
        nombreAnnulees: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.ANNULEE
        ),
        nombreNonQualifiables: 0,
        nombreAQualifier: 0,
        nombreQualifiees: 0,

        nombreActionsParPage: LIMITE_NOMBRE_ACTIONS_PAR_PAGE
      }
    }
    if (nombreTotalActionsFiltrees === 0) {
      return success(result)
    }

    const actionsSqlModel = await ActionSqlModel.findAll({
      where: filtres,
      order: this.trier[query.tri ?? Action.Tri.STATUT],
      limit: generateLimit(nombreTotalActionsFiltrees, query.page),
      offset: generateOffset(query.page),
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })

    let nombreNonQualifiables = 0
    let nombreAQualifier = 0
    let nombreQualifiees = 0
    const actions: ActionQueryModel[] = actionsSqlModel.map(sql => {
      const queryModel: ActionQueryModel = fromSqlToActionQueryModel(sql)
      switch (queryModel.etat) {
        case Action.Qualification.Etat.NON_QUALIFIABLE:
          nombreNonQualifiables++
          break
        case Action.Qualification.Etat.A_QUALIFIER:
          nombreAQualifier++
          break
        case Action.Qualification.Etat.QUALIFIEE:
          nombreQualifiees++
          break
      }

      return queryModel
    })

    return success({
      metadonnees: {
        ...result.metadonnees,
        nombreNonQualifiables,
        nombreAQualifier,
        nombreQualifiees
      },
      actions
    })
  }

  async authorize(
    query: GetActionsJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
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

  private compterActionsParStatut(idJeune: string): Promise<RawCount[]> {
    return this.sequelize.query(
      `
        SELECT statut, COUNT(*)
        FROM action
        WHERE id_jeune = :idJeune
        GROUP BY statut;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          idJeune
        }
      }
    ) as unknown as Promise<RawCount[]>
  }

  private compterToutesLesActions(statutRawCount: RawCount[]): number {
    return statutRawCount.reduce(
      (total, { count }) => total + parseInt(count),
      0
    )
  }

  private getCompteDuStatut(
    statutRawCount: RawCount[],
    statut: Action.Statut
  ): number {
    const count = statutRawCount.find(raw => raw.statut === statut)?.count
    return count ? parseInt(count) : 0
  }

  trier: Record<Action.Tri, Order> = {
    date_croissante: [['date_creation', 'ASC']],
    date_decroissante: [['date_creation', 'DESC']],
    date_echeance_croissante: [['date_echeance', 'ASC']],
    date_echeance_decroissante: [['date_echeance', 'DESC']],
    statut: [
      this.sequelize.literal(
        `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
      ),
      ['date_derniere_actualisation', 'DESC']
    ]
  }
}

function generateLimit(nombreTotalActions: number, page?: number): number {
  return page ? LIMITE_NOMBRE_ACTIONS_PAR_PAGE : nombreTotalActions
}

function generateOffset(page?: number): number {
  return page ? (page - 1) * LIMITE_NOMBRE_ACTIONS_PAR_PAGE : OFFSET_PAR_DEFAUT
}

function laPageExiste(nombreTotalActions: number, page?: number): boolean {
  if (!page || page === 1) {
    return true
  }
  const pageMax = Math.ceil(nombreTotalActions / LIMITE_NOMBRE_ACTIONS_PAR_PAGE)
  return page <= pageMax
}

function generateWhere(query: GetActionsJeuneQuery): WhereOptions {
  const filtres: WhereOptions = {
    idJeune: query.idJeune
  }

  if (query.etats?.length) {
    filtres.heuresQualifiees = { [Op.or]: {} }
    filtres.statut = { [Op.and]: { [Op.or]: {} } }
    if (query.statuts) filtres.statut[Op.and][Op.in] = query.statuts

    if (query.etats.includes(Action.Qualification.Etat.QUALIFIEE)) {
      filtres.heuresQualifiees[Op.or][Op.not] = null
    }

    if (query.etats.includes(Action.Qualification.Etat.A_QUALIFIER)) {
      filtres.heuresQualifiees[Op.or][Op.is] = null
      filtres.statut[Op.and][Op.or][Op.eq] = Action.Statut.TERMINEE
    }

    if (query.etats.includes(Action.Qualification.Etat.NON_QUALIFIABLE)) {
      filtres.statut[Op.and][Op.or][Op.ne] = Action.Statut.TERMINEE
    }
  } else if (query.statuts) filtres.statut = query.statuts

  return filtres
}

interface RawCount {
  statut: Action.Statut
  count: string
}
