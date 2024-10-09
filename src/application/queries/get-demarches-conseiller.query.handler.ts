import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estPoleEmploiOuCD } from '../../domain/core'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { DemarcheQueryModel } from './query-models/actions.query-model'

export interface GetDemarchesConseillerQuery extends Query {
  idConseiller: string
  idJeune: string
  accessToken: string
  dateDebut?: DateTime
}

@Injectable()
export class GetDemarchesConseillerQueryHandler extends QueryHandler<
  GetDemarchesConseillerQuery,
  Result<Cached<DemarcheQueryModel[]>>
> {
  constructor(
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetDemarchesConseillerQueryHandler')
  }

  async handle(
    query: GetDemarchesConseillerQuery
  ): Promise<Result<Cached<DemarcheQueryModel[]>>> {
    return this.getDemarchesQueryGetter.handle({
      idJeune: query.idJeune,
      accessToken: query.accessToken,
      tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin,
      dateDebut: query.dateDebut,
      pourConseiller: true
    })
  }

  async authorize(
    query: GetDemarchesConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
      query.idConseiller,
      query.idJeune,
      utilisateur,
      estPoleEmploiOuCD(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
