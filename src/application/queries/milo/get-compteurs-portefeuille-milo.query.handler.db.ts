import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { QueryTypes, Sequelize } from 'sequelize'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { CompteursBeneficiaireQueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'

export interface GetCompteursBeneficiaireMiloQuery extends Query {
  accessToken: string
  idConseiller: string
  dateDebut: DateTime
  dateFin: DateTime
}

@Injectable()
export class GetCompteursBeneficiaireMiloQueryHandler extends QueryHandler<
  GetCompteursBeneficiaireMiloQuery,
  Result<CompteursBeneficiaireQueryModel[]>
> {
  constructor(
    private getAgendaSessionsConseillerMiloQueryHandler: GetAgendaSessionsConseillerMiloQueryHandler,
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetCompteursBeneficiaireMiloQueryHandler')
  }

  async handle(
    query: GetCompteursBeneficiaireMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<CompteursBeneficiaireQueryModel[]>> {
    const mergeMap: {
      [key: string]: { actions: number; rdvs: number; sessions: number }
    } = {}

    const compteurActions = await this.getActionsDeLaSemaineByConseiller(
      utilisateur.id,
      query.dateDebut,
      query.dateFin
    )

    const compteursRdv = await this.getRdvDeLaSemaineByConseiller(
      utilisateur.id,
      query.dateDebut,
      query.dateFin
    )

    let compteursSessions: Result<Array<{ id: string; sessions: number }>> =
      await this.sessionsRecupereesToCompteursSessions(
        utilisateur.id,
        query.accessToken,
        query.dateDebut.toUTC().startOf('day'),
        query.dateFin.toUTC().endOf('day')
      )

    if (isFailure(compteursSessions)) {
      compteursSessions = success([])
    }

    compteurActions.forEach(({ id, actions }) => {
      mergeMap[id] = { actions: Number(actions), rdvs: 0, sessions: 0 }
    })

    compteursRdv.forEach(({ id, rdvs }) => {
      const nbRdvs = Number(rdvs)
      if (mergeMap[id]) {
        mergeMap[id].rdvs = nbRdvs
      } else {
        mergeMap[id] = { actions: 0, rdvs: nbRdvs, sessions: 0 }
      }
    })

    compteursSessions.data.forEach(({ id, sessions }) => {
      const nbSessions = Number(sessions)
      if (mergeMap[id]) {
        mergeMap[id].sessions = nbSessions
      } else {
        mergeMap[id] = { actions: 0, rdvs: 0, sessions: nbSessions }
      }
    })

    const mergedCompteurs: CompteursBeneficiaireQueryModel[] = Object.entries(
      mergeMap
    ).map(([idBeneficiaire, { actions, rdvs, sessions }]) => ({
      idBeneficiaire,
      actions,
      rdvs,
      sessions
    }))

    return success(mergedCompteurs)
  }

  async authorize(
    query: GetCompteursBeneficiaireMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }

  private async getActionsDeLaSemaineByConseiller(
    idConseiller: string,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<Array<{ id: string; actions: number }>> {
    const sqlActions: Array<{ id: string; actions: number }> =
      await this.sequelize.query(
        `
          SELECT jeune.id as id,
                 COUNT(action.id) as actions
          FROM action, jeune
          WHERE 
            id_conseiller = :idConseiller AND 
            action.id_jeune = jeune.id AND
            action.id_createur = jeune.id AND 
            action.date_creation >= :dateDebut AND 
            action.date_creation <= :dateFin 
          GROUP BY jeune.id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            idConseiller,
            dateDebut: dateDebut.toUTC().startOf('day').toFormat('yyyy-MM-dd'),
            dateFin: dateFin.toUTC().endOf('day').toFormat('yyyy-MM-dd')
          }
        }
      )

    return sqlActions
  }

  private async getRdvDeLaSemaineByConseiller(
    idConseiller: string,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<Array<{ id: string; rdvs: number }>> {
    const sqlRdv: Array<{ id: string; rdvs: number }> =
      await this.sequelize.query(
        `
          SELECT jeune.id as id,
                 COUNT(jeune.id) as rdvs
          FROM rendez_vous, rendez_vous_jeune_association, jeune
          WHERE
              rendez_vous_jeune_association.id_rendez_vous = rendez_vous.id AND
              rendez_vous_jeune_association.id_jeune = jeune.id AND
              jeune.id_conseiller = :idConseiller AND 
              rendez_vous.date >= :dateDebut AND 
              rendez_vous.date <= :dateFin 
          GROUP BY jeune.id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            idConseiller,
            dateDebut: dateDebut.toUTC().startOf('day').toFormat('yyyy-MM-dd'),
            dateFin: dateFin.toUTC().endOf('day').toFormat('yyyy-MM-dd')
          }
        }
      )
    return sqlRdv
  }

  private async sessionsRecupereesToCompteursSessions(
    idConseiller: string,
    accessToken: string,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<Result<Array<{ id: string; sessions: number }>>> {
    const nbSessionsParJeune: { [key: string]: number } = {}

    const sessionsRecuperees =
      await this.getAgendaSessionsConseillerMiloQueryHandler.handle({
        idConseiller,
        accessToken,
        dateDebut,
        dateFin
      })

    if (isFailure(sessionsRecuperees)) return sessionsRecuperees

    sessionsRecuperees.data.forEach(session => {
      session.beneficiaires.forEach(({ idJeune }) => {
        if (nbSessionsParJeune[idJeune]) {
          nbSessionsParJeune[idJeune]++
        } else {
          nbSessionsParJeune[idJeune] = 1
        }
      })
    })

    return success(
      Object.entries(nbSessionsParJeune).map(([id, sessions]) => ({
        id,
        sessions
      }))
    )
  }
}
