import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { GetRendezVousJeunePoleEmploiQueryGetter } from 'src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  isSuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estPoleEmploiBRSA } from '../../../domain/core'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { GetMonSuiviPoleEmploiQueryModel } from '../query-models/jeunes.pole-emploi.query-model'

export interface GetMonSuiviPoleEmploiQuery extends Query {
  idJeune: string
  dateDebut: DateTime
  accessToken: string
}

@Injectable()
export class GetMonSuiviPoleEmploiQueryHandler extends QueryHandler<
  GetMonSuiviPoleEmploiQuery,
  Result<GetMonSuiviPoleEmploiQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter
  ) {
    super('GetMonSuiviPoleEmploiQueryHandler')
  }

  async authorize(
    query: GetMonSuiviPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploiBRSA(utilisateur.structure)
    )
  }

  async handle(
    query: GetMonSuiviPoleEmploiQuery,
    _utilisateur: Authentification.Utilisateur
  ): Promise<Result<GetMonSuiviPoleEmploiQueryModel>> {
    const rdvs = await this.getRendezVousJeunePoleEmploiQueryGetter.handle(
      query
    )

    if (isSuccess(rdvs)) return success({ rendezVous: rdvs.data.queryModel })
    return rdvs
  }

  async monitor(): Promise<void> {
    return
  }
}
