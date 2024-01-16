import { Inject, Injectable } from '@nestjs/common'
import { fromDemarcheDtoToDemarche } from '../../application/queries/query-mappers/actions-pole-emploi.mappers'
import { isSuccess, Result, success } from '../../building-blocks/types/result'
import { Demarche } from '../../domain/demarche'
import { DateService } from '../../utils/date-service'
import { KeycloakClient } from '../clients/keycloak-client'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../clients/pole-emploi-partenaire-client.db'
import { Core } from '../../domain/core'

@Injectable()
export class DemarcheHttpRepository implements Demarche.Repository {
  constructor(
    private keycloakClient: KeycloakClient,
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private dateService: DateService
  ) {}

  async update(
    demarcheModifiee: Demarche.Modifiee,
    accessToken: string,
    structure: Core.Structure
  ): Promise<Result<Demarche>> {
    const token = await this.keycloakClient.exchangeTokenJeune(
      accessToken,
      structure
    )
    const result = await this.poleEmploiPartenaireClient.updateDemarche(
      demarcheModifiee,
      token
    )

    if (isSuccess(result)) {
      return success(fromDemarcheDtoToDemarche(result.data, this.dateService))
    }

    return result
  }

  async save(
    demarche: Demarche.Creee,
    accessToken: string,
    structure: Core.Structure
  ): Promise<Result<Demarche>> {
    const token = await this.keycloakClient.exchangeTokenJeune(
      accessToken,
      structure
    )
    const result = await this.poleEmploiPartenaireClient.createDemarche(
      demarche,
      token
    )

    if (isSuccess(result)) {
      return success(fromDemarcheDtoToDemarche(result.data, this.dateService))
    }

    return result
  }
}
