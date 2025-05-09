import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../utils/date-service'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { estMilo } from '../../domain/core'
import { Jeune } from '../../domain/jeune/jeune'
import { GetComptageJeuneQueryGetter } from './query-getters/get-comptage-jeune.query.getter'

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
    private dateService: DateService,
    private getComptageJeuneQueryGetter: GetComptageJeuneQueryGetter
  ) {
    super('GetComptageJeuneQueryHandler')
  }

  async handle(
    query: GetComptageJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<ComptageJeuneQueryModel>> {
    const jeuneSql = await JeuneSqlModel.findByPk(query.idJeune)
    if (!jeuneSql) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    if (!jeuneSql.idPartenaire) {
      return failure(new MauvaiseCommandeError('Jeune sans idPartenaire'))
    }
    if (jeuneSql.dispositif !== Jeune.Dispositif.CEJ) {
      return failure(
        new MauvaiseCommandeError('Le Jeune doit être en dispositif CEJ')
      )
    }

    const resultComptage = await this.getComptageJeuneQueryGetter.handle({
      idJeune: query.idJeune,
      idDossier: jeuneSql.idPartenaire,
      accessTokenJeune: Authentification.estJeune(utilisateur.type)
        ? query.accessToken
        : undefined,
      accessTokenConseiller: Authentification.estConseiller(utilisateur.type)
        ? query.accessToken
        : undefined,
      dateDebut: query.dateDebut ?? this.dateService.now().startOf('week'),
      dateFin: query.dateFin ?? this.dateService.now().endOf('week')
    })

    if (isFailure(resultComptage)) return resultComptage

    return success({
      nbHeuresDeclarees: resultComptage.data.nbHeuresDeclarees,
      nbHeuresValidees: resultComptage.data.nbHeuresValidees!,
      dateDerniereMiseAJour: this.dateService.now().toISO()
    })
  }

  async authorize(
    query: GetComptageJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estJeune(utilisateur.type))
      return this.jeuneAuthorizer.autoriserLeJeune(
        query.idJeune,
        utilisateur,
        estMilo(utilisateur.structure)
      )
    return this.conseillerAuthorizer.autoriserConseillerPourSonJeune(
      query.idJeune,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
