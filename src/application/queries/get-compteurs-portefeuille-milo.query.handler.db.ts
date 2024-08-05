import { Inject, Injectable } from '@nestjs/common'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Query } from 'src/building-blocks/types/query'
import { QueryTypes, Sequelize } from 'sequelize'
import { DateTime } from 'luxon'
import { CompteursBeneficiaireQueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'
import {
  Conseiller,
  ConseillerRepositoryToken
} from 'src/domain/milo/conseiller'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { estMilo } from 'src/domain/core'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { MiloClient } from 'src/infrastructure/clients/milo-client'

export interface GetCompteursBeneficiaireMiloQuery extends Query {
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
    private conseillerAuthorizer: ConseillerAuthorizer,
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient,
    @Inject(ConseillerRepositoryToken)
    private readonly conseillersRepository: Conseiller.Milo.Repository,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetCompteursBeneficiaireMiloQueryHandler')
  }

  async handle(
    query: GetCompteursBeneficiaireMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<CompteursBeneficiaireQueryModel[]>> {
    const mergeMap: { [key: string]: { actions: number; rdvs: number } } = {}

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

    compteurActions.forEach(({ id, actions }) => {
      mergeMap[id] = { actions: Number(actions), rdvs: 0 }
    })

    compteursRdv.forEach(({ id, rdvs }) => {
      const nbRdvs = Number(rdvs)
      if (mergeMap[id]) {
        mergeMap[id].rdvs = nbRdvs
      } else {
        mergeMap[id] = { actions: 0, rdvs: nbRdvs }
      }
    })

    const mergedCompteurs: CompteursBeneficiaireQueryModel[] = Object.entries(
      mergeMap
    ).map(([idBeneficiaire, { actions, rdvs }]) => ({
      idBeneficiaire,
      actions,
      rdvs
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
          FROM action
                   RIGHT JOIN jeune ON action.id_jeune = jeune.id
          WHERE id_conseiller = :idConseiller AND id_createur = jeune.id AND action.date_creation >= :dateDebut AND action.date_creation <= :dateFin 
          GROUP BY jeune.id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            idConseiller,
            dateDebut: dateDebut.toJSDate(),
            dateFin: dateFin.toJSDate()
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
            dateDebut: dateDebut.toJSDate(),
            dateFin: dateFin.toJSDate()
          }
        }
      )
    return sqlRdv
  }
}
