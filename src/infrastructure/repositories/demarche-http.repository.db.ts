import { Demarche } from '../../domain/demarche'
import { isSuccess, Result, success } from '../../building-blocks/types/result'
import { KeycloakClient } from '../clients/keycloak-client'
import { PoleEmploiPartenaireClient } from '../clients/pole-emploi-partenaire-client'
import { Injectable } from '@nestjs/common'
import { fromDemarcheDtoToDemarche } from '../../application/queries/query-mappers/actions-pole-emploi.mappers'
import { DateService } from '../../utils/date-service'

@Injectable()
export class DemarcheHttpRepositoryDb implements Demarche.Repository {
  constructor(
    private keycloakClient: KeycloakClient,
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private dateService: DateService
  ) {}

  async update(
    demarcheModifiee: Demarche.Modifiee,
    accessToken: string
  ): Promise<Result<Demarche>> {
    const token = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      accessToken
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
    accessToken: string
  ): Promise<Result<Demarche>> {
    const token = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      accessToken
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
