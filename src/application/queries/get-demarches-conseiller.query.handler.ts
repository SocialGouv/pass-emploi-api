import { Inject, Injectable } from '@nestjs/common'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { estConseilDept, estPoleEmploi } from '../../domain/core'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { DemarcheQueryModel } from './query-models/actions.query-model'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client.db'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { DateTime } from 'luxon'

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
    private conseillerAuthorizer: ConseillerAuthorizer,
    private authClient: KeycloakClient,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository
  ) {
    super('GetDemarchesConseillerQueryHandler')
  }

  async handle(
    query: GetDemarchesConseillerQuery
  ): Promise<Result<Cached<DemarcheQueryModel[]>>> {
    const jeuneUtilisateur = await this.authentificationRepository.getJeuneById(
      query.idJeune
    )

    if (!jeuneUtilisateur?.idAuthentification) {
      return failure(new NonTrouveError('Jeune'))
    }
    const idpTokenJeune = await this.authClient.exchangeTokenConseillerJeune(
      query.accessToken,
      jeuneUtilisateur.idAuthentification
    )
    const demarches = await this.getDemarchesQueryGetter.handle({
      idJeune: query.idJeune,
      accessToken: query.accessToken,
      tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin,
      idpToken: idpTokenJeune,
      dateDebut: query.dateDebut
    })

    if (isFailure(demarches)) {
      return demarches
    }

    const data: Cached<DemarcheQueryModel[]> = {
      queryModel: demarches.data.queryModel,
      dateDuCache: demarches.data.dateDuCache
    }
    return success(data)
  }

  async authorize(
    query: GetDemarchesConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
      query.idConseiller,
      query.idJeune,
      utilisateur,
      estPoleEmploi(utilisateur.structure) ||
        estConseilDept(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
