import { Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { TransfertConseillerSqlModel } from '../../infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { ConseillerAgenceAuthorizer } from '../authorizers/authorize-conseiller-agence'
import { HistoriqueConseillerJeuneQueryModel } from './query-models/jeunes.query-model'

export interface GetConseillersJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetConseillersJeuneQueryHandler extends QueryHandler<
  GetConseillersJeuneQuery,
  Result<HistoriqueConseillerJeuneQueryModel[]>
> {
  constructor(private conseillerAgenceAuthorizer: ConseillerAgenceAuthorizer) {
    super('GetConseillersJeuneQueryHandler')
  }

  async handle(
    query: GetConseillersJeuneQuery
  ): Promise<Result<HistoriqueConseillerJeuneQueryModel[]>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [
        ConseillerSqlModel,
        {
          model: TransfertConseillerSqlModel,
          separate: true,
          order: [['dateTransfert', 'DESC']],
          include: [
            {
              model: ConseillerSqlModel,
              as: 'conseillerSource'
            },
            {
              model: ConseillerSqlModel,
              as: 'conseillerCible'
            }
          ]
        }
      ]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const result: HistoriqueConseillerJeuneQueryModel[] = []
    const ilNyAPasEuDeTransfert = !jeuneSqlModel.transferts.length
    if (ilNyAPasEuDeTransfert) {
      const conseillerInitial: ConseillerSqlModel = jeuneSqlModel.conseiller!
      result.push(
        this.buildHistoriqueConseiller(
          conseillerInitial,
          jeuneSqlModel.dateCreation
        )
      )
    } else {
      for (
        let transfertIndex = 0;
        transfertIndex < jeuneSqlModel.transferts.length;
        transfertIndex++
      ) {
        const transfert = jeuneSqlModel.transferts[transfertIndex]
        result.push(
          this.buildHistoriqueConseiller(
            transfert.conseillerCible,
            transfert.dateTransfert
          )
        )
        const estLeConseillerInitial =
          transfertIndex === jeuneSqlModel.transferts.length - 1
        if (estLeConseillerInitial) {
          result.push(
            this.buildHistoriqueConseiller(
              transfert.conseillerSource,
              jeuneSqlModel.dateCreation
            )
          )
        }
      }
    }

    return success(result)
  }

  private buildHistoriqueConseiller(
    conseillerSqlModel: ConseillerSqlModel,
    date: Date
  ): HistoriqueConseillerJeuneQueryModel {
    return {
      id: conseillerSqlModel.id,
      nom: conseillerSqlModel.nom,
      prenom: conseillerSqlModel.prenom,
      email: conseillerSqlModel.email ?? undefined,
      date: date.toISOString()
    }
  }

  async authorize(
    query: GetConseillersJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgence(
      query.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
