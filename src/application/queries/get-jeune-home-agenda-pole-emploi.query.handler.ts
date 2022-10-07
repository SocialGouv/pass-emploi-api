import { Query } from '../../building-blocks/types/query'
import { isFailure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneHomeAgendaPoleEmploiQueryModel } from './query-models/home-jeune-suivi.query-model'
import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'

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
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
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
      this.getRendezVousJeunePoleEmploiQueryGetter.handle({
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
        DateTime.fromISO(demarche.dateFin) >= maintenant &&
        DateTime.fromISO(demarche.dateFin) <= dansDeuxSemaines
    )
    const rendezVous = resultRendezVous.data.filter(
      unRendezVous =>
        unRendezVous.date >= maintenant.toJSDate() &&
        unRendezVous.date <= dansDeuxSemaines.toJSDate()
    )
    const nombreDeDemarchesEnRetard = resultDemarches.data.filter(
      demarche => DateTime.fromISO(demarche.dateFin) <= maintenant
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
