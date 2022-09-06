import { Inject, Injectable } from '@nestjs/common'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { DateService } from '../../utils/date-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { PoleEmploiPartenaireClient } from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { fromDemarcheDtoToDemarche } from './query-mappers/actions-pole-emploi.mappers'
import { DemarcheQueryModel } from './query-models/actions.query-model'
import { Demarche } from '../../domain/demarche'

export interface GetDemarchesQuery extends Query {
  idJeune: string
  accessToken: string
  tri: TriQuery
}

@Injectable()
export class GetDemarchesQueryHandler extends QueryHandler<
  GetDemarchesQuery,
  Result<DemarcheQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private dateService: DateService,
    private keycloakClient: KeycloakClient
  ) {
    super('GetDemarchesQueryHandler')
  }

  async handle(
    query: GetDemarchesQuery
  ): Promise<Result<DemarcheQueryModel[]>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    try {
      const demarchesDto = await this.poleEmploiPartenaireClient.getDemarches(
        idpToken
      )

      const demarches = demarchesDto
        .map(demarcheDto =>
          fromDemarcheDtoToDemarche(demarcheDto, this.dateService)
        )
        .sort(query.tri)

      return success(demarches)
    } catch (e) {
      this.logger.error(e)
      if (e.response) {
        return failure(
          new ErreurHttp(e.response.data?.message, e.response.status)
        )
      }
      throw e
    }
  }

  async authorize(
    query: GetDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}

export namespace GetDemarchesQuery {
  export namespace Tri {
    export function parSatutEtDateFin(
      demarche1: DemarcheQueryModel,
      demarche2: DemarcheQueryModel
    ): number {
      return parStatut(demarche1, demarche2) || parDateFin(demarche1, demarche2)
    }

    export function parDateFin(
      demarche1: DemarcheQueryModel,
      demarche2: DemarcheQueryModel
    ): number {
      return demarche1.dateFin.getTime() - demarche2.dateFin.getTime()
    }

    function parStatut(
      demarche1: DemarcheQueryModel,
      demarche2: DemarcheQueryModel
    ): number {
      return statutsOrder[demarche1.statut] - statutsOrder[demarche2.statut]
    }

    const statutsOrder: { [statut in Demarche.Statut]: number } = {
      A_FAIRE: 1,
      EN_COURS: 1,
      ANNULEE: 2,
      REALISEE: 2
    }
  }
}

interface TriQuery {
  (demarche1: DemarcheQueryModel, demarche2: DemarcheQueryModel): number
}
