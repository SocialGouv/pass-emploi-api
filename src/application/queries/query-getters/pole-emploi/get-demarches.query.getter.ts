import { Jeune, JeunesRepositoryToken } from '../../../../domain/jeune/jeune'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { DemarcheQueryModel } from '../../query-models/actions.query-model'
import { DateService } from '../../../../utils/date-service'
import {
  failure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../building-blocks/types/domain-error'
import { Demarche } from '../../../../domain/demarche'
import {
  PoleEmploiPartenaire,
  PoleEmploiPartenaireClient
} from '../../../../infrastructure/clients/pole-emploi-partenaire-client'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client'
import { fromDemarcheDtoToDemarche } from '../../query-mappers/actions-pole-emploi.mappers'

export interface Query {
  idJeune: string
  accessToken: string
  tri: GetDemarchesQueryGetter.TriQuery
}

@Injectable()
export class GetDemarchesQueryGetter {
  private logger: Logger

  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(PoleEmploiPartenaire.PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private dateService: DateService,
    private keycloakClient: KeycloakClient
  ) {
    this.logger = new Logger('GetDemarchesQueryGetter')
  }

  async handle(query: Query): Promise<Result<DemarcheQueryModel[]>> {
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
}

export namespace GetDemarchesQueryGetter {
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

  export interface TriQuery {
    (demarche1: DemarcheQueryModel, demarche2: DemarcheQueryModel): number
  }
}
