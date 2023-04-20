import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Demarche } from '../../domain/demarche'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { JeuneHomeAgendaPoleEmploiQueryModel } from './query-models/home-jeune-suivi.query-model'
import { Core } from '../../domain/core'

export interface GetJeuneHomeAgendaPoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
  maintenant: DateTime
}

@Injectable()
export class GetJeuneHomeAgendaPoleEmploiQueryHandler extends QueryHandler<
  GetJeuneHomeAgendaPoleEmploiQuery,
  Result<Cached<JeuneHomeAgendaPoleEmploiQueryModel>>
> {
  constructor(
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer,
    private keycloakClient: KeycloakClient
  ) {
    super('GetJeuneHomeAgendaPoleEmploiQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaPoleEmploiQuery
  ): Promise<Result<Cached<JeuneHomeAgendaPoleEmploiQueryModel>>> {
    const dansDeuxSemaines = query.maintenant.plus({ weeks: 2 })

    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    const [resultDemarches, resultRendezVous] = await Promise.all([
      this.getDemarchesQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parDateFin,
        idpToken
      }),
      this.getRendezVousJeunePoleEmploiQueryGetter.handle({
        ...query,
        idpToken
      })
    ])

    if (isFailure(resultDemarches)) {
      return resultDemarches
    }

    if (isFailure(resultRendezVous)) {
      return resultRendezVous
    }

    const demarches = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) >= query.maintenant &&
        DateTime.fromISO(demarche.dateFin) <= dansDeuxSemaines
    )
    const rendezVous = resultRendezVous.data.queryModel.filter(
      unRendezVous =>
        unRendezVous.date >= query.maintenant.toJSDate() &&
        unRendezVous.date <= dansDeuxSemaines.toJSDate()
    )
    const nombreDeDemarchesEnRetard = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) <= query.maintenant &&
        demarche.statut !== Demarche.Statut.REALISEE &&
        demarche.statut !== Demarche.Statut.ANNULEE
    ).length

    const data: Cached<JeuneHomeAgendaPoleEmploiQueryModel> = {
      queryModel: {
        demarches,
        rendezVous,
        metadata: {
          dateDeDebut: query.maintenant.toJSDate(),
          dateDeFin: dansDeuxSemaines.toJSDate(),
          demarchesEnRetard: nombreDeDemarchesEnRetard
        }
      },
      dateDuCache: recupererLaDateLaPlusAncienne(
        resultDemarches.data.dateDuCache,
        resultRendezVous.data.dateDuCache
      )
    }
    return success(data)
  }

  async authorize(
    query: GetJeuneHomeAgendaPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(
      query.idJeune,
      utilisateur,
      Core.structuresPoleEmploiBRSA
    )
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
