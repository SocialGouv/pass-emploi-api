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
    const compteurActions = await this.getActionsDeLaSemaineByConseiller(
      utilisateur.id,
      query.dateDebut,
      query.dateFin
    )

    const compteurs = compteurActions.map(({ id, actions }) => ({
      idBeneficiaire: id,
      actions
    }))

    return success(compteurs)
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
    const sqlJeunes: Array<{ id: string; actions: number }> =
      await this.sequelize.query(
        `
          SELECT jeune.id as id,
                 COUNT(action.id) as actions
          FROM action
                   RIGHT JOIN jeune ON action.id_jeune = jeune.id
          WHERE id_conseiller = :idConseiller AND action.date_creation >= :dateDebut AND action.date_creation <= :dateFin 
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

    return sqlJeunes
  }
}
