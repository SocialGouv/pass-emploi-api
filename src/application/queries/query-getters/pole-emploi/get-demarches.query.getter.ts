import { Inject, Injectable, Logger } from '@nestjs/common'
import { NonTrouveError } from '../../../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { Demarche } from '../../../../domain/demarche'
import { Jeune, JeuneRepositoryToken } from '../../../../domain/jeune/jeune'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../../../infrastructure/clients/pole-emploi-partenaire-client.db'
import { DateService } from '../../../../utils/date-service'
import { fromDemarcheDtoToDemarche } from '../../query-mappers/actions-pole-emploi.mappers'
import { DemarcheQueryModel } from '../../query-models/actions.query-model'
import { toDemarcheQueryModel } from '../../query-mappers/demarche.mappers'
import { Cached } from '../../../../building-blocks/types/query'

export interface Query {
  idJeune: string
  tri: GetDemarchesQueryGetter.TriQuery
  accessToken: string
  idpToken?: string
}

@Injectable()
export class GetDemarchesQueryGetter {
  private logger: Logger

  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private dateService: DateService,
    private keycloakClient: KeycloakClient
  ) {
    this.logger = new Logger('GetDemarchesQueryGetter')
  }

  async handle(query: Query): Promise<Result<Cached<DemarcheQueryModel[]>>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const idpToken =
      query.idpToken ??
      (await this.keycloakClient.exchangeTokenJeune(
        query.accessToken,
        jeune.structure
      ))

    const demarchesDto = await this.poleEmploiPartenaireClient.getDemarches(
      idpToken
    )

    if (isFailure(demarchesDto)) {
      return demarchesDto
    }

    const demarches = demarchesDto.data
      .map(demarcheDto =>
        fromDemarcheDtoToDemarche(demarcheDto, this.dateService)
      )
      .sort(query.tri)

    const data: Cached<DemarcheQueryModel[]> = {
      queryModel: demarches.map(toDemarcheQueryModel),
      dateDuCache: demarchesDto.dateCache
    }
    return success(data)
  }
}

export namespace GetDemarchesQueryGetter {
  export namespace Tri {
    export function parSatutEtDateFin(
      demarche1: Demarche,
      demarche2: Demarche
    ): number {
      return parStatut(demarche1, demarche2) || parDateFin(demarche1, demarche2)
    }

    export function parDateFin(
      demarche1: Demarche,
      demarche2: Demarche
    ): number {
      return demarche1.dateFin.toMillis() - demarche2.dateFin.toMillis()
    }

    function parStatut(demarche1: Demarche, demarche2: Demarche): number {
      return statutsOrder[demarche1.statut] - statutsOrder[demarche2.statut]
    }

    const statutsOrder: { [statut in Demarche.Statut]: number } = {
      A_FAIRE: 1,
      EN_COURS: 1,
      ANNULEE: 2,
      REALISEE: 2
    }
  }

  export interface TriQuery {
    (demarche1: Demarche, demarche2: Demarche): number
  }
}
