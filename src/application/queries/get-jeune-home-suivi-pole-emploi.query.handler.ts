import { Query } from '../../building-blocks/types/query'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneHomeAgendaPoleEmploiQueryModel } from './query-models/home-jeune-suivi.query-model'
import { Injectable } from '@nestjs/common'
import { GetRendezVousJeunePoleEmploiQueryHandler } from './get-rendez-vous-jeune-pole-emploi.query.handler'
import { DateTime } from 'luxon'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'

export interface GetJeuneHomeAgendaPoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
  maintenant: string
}

@Injectable()
export class GetJeuneHomeAgendaPoleEmploiQueryHandler extends QueryHandler<
  GetJeuneHomeAgendaPoleEmploiQuery,
  Result<JeuneHomeAgendaPoleEmploiQueryModel>
> {
  constructor(
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer
  ) {
    super('GetJeuneHomeAgendaPoleEmploiQueryHandler')
  }

  async handle(
    query: GetJeuneHomeAgendaPoleEmploiQuery
  ): Promise<Result<JeuneHomeAgendaPoleEmploiQueryModel>> {
    const maintenant = DateTime.fromISO(query.maintenant, { setZone: true })
    const dansDeuxSemaines = maintenant.plus({ weeks: 2 })

    const [resultDemarches, resultRendezVous] = await Promise.all([
      this.getDemarchesQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parDateFin
      }),
      this.getRendezVousJeunePoleEmploiQueryHandler.handle({
        ...query
      })
    ])

    if (isFailure(resultDemarches)) {
      return resultDemarches
    }

    if (isFailure(resultRendezVous)) {
      return resultRendezVous
    }

    const demarches = resultDemarches.data.filter(
      demarche =>
        demarche.dateFin >= maintenant.toJSDate() &&
        demarche.dateFin <= dansDeuxSemaines.toJSDate()
    )
    const rendezVous = resultRendezVous.data.filter(
      rendezVous =>
        rendezVous.date >= maintenant.toJSDate() &&
        rendezVous.date <= dansDeuxSemaines.toJSDate()
    )
    const nombreDeDemarchesEnRetard = resultDemarches.data.filter(
      demarche => demarche.dateFin <= maintenant.toJSDate()
    ).length

    return success({
      demarches,
      rendezVous,
      metadata: {
        dateDeDebut: maintenant.toJSDate(),
        dateDeFin: dansDeuxSemaines.toJSDate(),
        demarchesEnRetard: nombreDeDemarchesEnRetard
      }
    })
  }

  async authorize(
    query: GetJeuneHomeAgendaPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
