import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { GetDemarchesQueryGetter } from 'src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from 'src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { Cached, Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estPoleEmploiBRSA } from '../../../domain/core'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { MonSuiviPoleEmploiQueryModel } from '../query-models/jeunes.pole-emploi.query-model'

export interface GetMonSuiviPoleEmploiQuery extends Query {
  idJeune: string
  dateDebut: DateTime
  accessToken: string
}

@Injectable()
export class GetMonSuiviPoleEmploiQueryHandler extends QueryHandler<
  GetMonSuiviPoleEmploiQuery,
  Result<Cached<MonSuiviPoleEmploiQueryModel>>
> {
  constructor(
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private readonly getDemarchesQueryGetter: GetDemarchesQueryGetter
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
    query: GetMonSuiviPoleEmploiQuery
  ): Promise<Result<Cached<MonSuiviPoleEmploiQueryModel>>> {
    const [rdvs, demarches] = await Promise.all([
      await this.getRendezVousJeunePoleEmploiQueryGetter.handle(query),
      await this.getDemarchesQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parDateFin
      })
    ])

    if (isFailure(rdvs)) return rdvs
    if (isFailure(demarches)) return demarches

    return success({
      queryModel: {
        rendezVous: rdvs.data.queryModel,
        demarches: demarches.data.queryModel
      },
      dateDuCache: recupererLaDateLaPlusAncienne(
        rdvs.data.dateDuCache,
        demarches.data.dateDuCache
      )
    })
  }

  async monitor(): Promise<void> {
    return
  }
}

function recupererLaDateLaPlusAncienne(
  dateUne: DateTime | undefined,
  dateDeux: DateTime | undefined
): DateTime | undefined {
  if (!dateUne) {
    return dateDeux
  }

  if (!dateDeux) {
    return dateUne
  }

  return dateUne < dateDeux ? dateUne : dateDeux
}
