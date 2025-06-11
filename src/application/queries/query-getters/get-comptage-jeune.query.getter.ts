import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import {
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Action } from '../../../domain/action/action'
import { Qualification } from '../../../domain/action/qualification'
import { Core } from '../../../domain/core'
import { CodeTypeRendezVous } from '../../../domain/rendez-vous/rendez-vous'
import {
  MILO_INSCRIT,
  MILO_PRESENT,
  OffreTypeCode,
  SessionParDossierJeuneDto
} from '../../../infrastructure/clients/dto/milo.dto'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
import { OidcClient } from '../../../infrastructure/clients/oidc-client.db'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'

export interface GetComptageJeuneQuery extends Query {
  idJeune: string
  idDossier: string
  accessTokenJeune?: string
  accessTokenConseiller?: string
  dateDebut: DateTime
  dateFin: DateTime
}

@Injectable()
export class GetComptageJeuneQueryGetter {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private oidcClient: OidcClient,
    private readonly miloClient: MiloClient
  ) {}

  async handle(
    query: GetComptageJeuneQuery
  ): Promise<Result<{ nbHeuresDeclarees: number; nbHeuresValidees: number }>> {
    const dateDebut = query.dateDebut.startOf('day').toJSDate()
    const dateFin = query.dateFin.endOf('day').toJSDate()

    const { comptageActionsDeclarees, comptageActionsValidees } =
      await this.compterAction(query.idJeune, dateDebut, dateFin)
    const { comptageRdvsDeclares, comptageRdvsValides } =
      await this.compterRdvs(query.idJeune, dateDebut, dateFin)
    const resultComptageSessions = await this.compterSessions(
      query.idDossier,
      query.dateDebut,
      query.dateFin,
      query.accessTokenJeune,
      query.accessTokenConseiller
    )
    if (isFailure(resultComptageSessions)) return resultComptageSessions
    const { comptageSessionsDeclarees, comptageSessionsValidees } =
      resultComptageSessions.data

    return success({
      nbHeuresDeclarees:
        comptageActionsDeclarees +
        comptageRdvsDeclares +
        comptageSessionsDeclarees,
      nbHeuresValidees:
        comptageActionsValidees + comptageRdvsValides + comptageSessionsValidees
    })
  }

  private async compterAction(
    idJeune: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{
    comptageActionsDeclarees: number
    comptageActionsValidees: number
  }> {
    const inPeriode = {
      [Op.between]: [dateDebut, dateFin]
    }
    const actions = await ActionSqlModel.findAll({
      where: {
        idJeune,
        [Op.or]: [
          {
            [Op.and]: {
              statut: Action.Statut.EN_COURS,
              dateEcheance: inPeriode
            }
          },
          {
            [Op.and]: {
              statut: Action.Statut.TERMINEE,
              [Op.or]: [
                { dateFinReelle: inPeriode },
                { dateFinReelle: null, dateEcheance: inPeriode }
              ]
            }
          }
        ]
      }
    })
    const comptageActionsDeclarees = actions.reduce((acc, action) => {
      if (action.heuresQualifiees) {
        return acc + action.heuresQualifiees
      } else if (
        action.codeQualification &&
        Qualification.mapCodeTypeQualification[action.codeQualification]?.heures
      ) {
        return (
          acc +
          Qualification.mapCodeTypeQualification[action.codeQualification]
            .heures
        )
      }
      return acc
    }, 0)

    const comptageActionsValidees = actions.reduce((acc, action) => {
      if (action.heuresQualifiees && action.statut === Action.Statut.TERMINEE) {
        return acc + action.heuresQualifiees
      }
      return acc
    }, 0)

    return { comptageActionsDeclarees, comptageActionsValidees }
  }

  private async compterRdvs(
    idJeune: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{
    comptageRdvsDeclares: number
    comptageRdvsValides: number
  }> {
    const rdvs = await this.sequelize.query<{
      type: CodeTypeRendezVous
      present: boolean | null
    }>(
      `
      SELECT type, present
      FROM rendez_vous
      JOIN rendez_vous_jeune_association ON rendez_vous.id = rendez_vous_jeune_association.id_rendez_vous
      WHERE rendez_vous.date BETWEEN :dateDebut AND :dateFin
        AND rendez_vous_jeune_association.id_jeune = :idJeune
      `,
      {
        replacements: {
          dateDebut,
          dateFin,
          idJeune
        },
        type: QueryTypes.SELECT
      }
    )
    const comptageRdvsDeclares = rdvs.reduce((acc, rdv) => {
      if (rdv.present !== false) {
        if (rdv.type === CodeTypeRendezVous.ATELIER) {
          return acc + 4
        }
        if (rdv.type === CodeTypeRendezVous.INFORMATION_COLLECTIVE) {
          return acc + 3
        }
        return acc + 1
      }
      return acc
    }, 0)

    const comptageRdvsValides = rdvs.reduce((acc, rdv) => {
      if (rdv.present) {
        if (rdv.type === CodeTypeRendezVous.ATELIER) {
          return acc + 4
        }
        if (rdv.type === CodeTypeRendezVous.INFORMATION_COLLECTIVE) {
          return acc + 3
        }
        return acc + 1
      }
      return acc
    }, 0)

    return { comptageRdvsDeclares, comptageRdvsValides }
  }

  private async compterSessions(
    idDossier: string,
    dateDebut: DateTime,
    dateFin: DateTime,
    accessTokenJeune?: string,
    accessTokenConseiller?: string
  ): Promise<
    Result<{
      comptageSessionsDeclarees: number
      comptageSessionsValidees: number
    }>
  > {
    let resultSessions: Result<SessionParDossierJeuneDto[]> = success([])

    if (accessTokenConseiller) {
      const idpToken = await this.oidcClient.exchangeToken(
        accessTokenConseiller,
        Core.Structure.MILO
      )
      resultSessions =
        await this.miloClient.getSessionsParDossierJeunePourConseiller(
          idpToken,
          idDossier,
          {
            debut: dateDebut.startOf('day'),
            fin: dateFin.endOf('day')
          }
        )
    }
    if (accessTokenJeune) {
      const idpToken = await this.oidcClient.exchangeToken(
        accessTokenJeune,
        Core.Structure.MILO
      )
      resultSessions = await this.miloClient.getSessionsParDossierJeune(
        idpToken,
        idDossier,
        {
          debut: dateDebut.startOf('day'),
          fin: dateFin.endOf('day')
        }
      )
    }
    if (isFailure(resultSessions)) return resultSessions

    const comptageSessionsDeclarees = resultSessions.data.reduce(
      (acc, session) => {
        if (
          session.sessionInstance?.statut === MILO_PRESENT ||
          session.sessionInstance?.statut === MILO_INSCRIT
        ) {
          if (session.offre.type === OffreTypeCode.WORKSHOP) {
            return acc + 4
          }
          if (session.offre.type === OffreTypeCode.COLLECTIVE_INFORMATION) {
            return acc + 3
          }
        }
        return acc
      },
      0
    )

    const comptageSessionsValidees = resultSessions.data.reduce(
      (acc, session) => {
        if (session.sessionInstance?.statut === MILO_PRESENT) {
          if (session.offre.type === OffreTypeCode.WORKSHOP) {
            return acc + 4
          }
          if (session.offre.type === OffreTypeCode.COLLECTIVE_INFORMATION) {
            return acc + 3
          }
        }
        return acc
      },
      0
    )

    return success({ comptageSessionsDeclarees, comptageSessionsValidees })
  }
}
