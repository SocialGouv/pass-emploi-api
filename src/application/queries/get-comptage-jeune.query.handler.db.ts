import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../utils/date-service'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

export class ComptageJeuneQueryModel {
  @ApiProperty()
  nbHeuresDeclarees: number

  @ApiProperty()
  nbHeuresValidees: number

  @ApiProperty()
  dateDerniereMiseAJour: string
}

export interface GetComptageJeuneQuery extends Query {
  idJeune: string
  accessToken: string
  dateDebut?: DateTime
  dateFin?: DateTime
}

@Injectable()
export class GetComptageJeuneQueryHandler extends QueryHandler<
  GetComptageJeuneQuery,
  Result<ComptageJeuneQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private dateService: DateService
  ) {
    super('GetComptageJeuneQueryHandler')
  }

  async handle(
    query: GetComptageJeuneQuery
  ): Promise<Result<ComptageJeuneQueryModel>> {
    const jeuneSql = await JeuneSqlModel.findByPk(query.idJeune)
    if (!jeuneSql) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    return success({
      nbHeuresDeclarees: 3,
      nbHeuresValidees: 1,
      dateDerniereMiseAJour: this.dateService.now().toISO()
    })
  }

  async authorize(
    query: GetComptageJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estJeune(utilisateur.type))
      return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
    return this.conseillerAuthorizer.autoriserConseillerPourSonJeune(
      query.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
