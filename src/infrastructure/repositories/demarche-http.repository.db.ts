import { Inject, Injectable } from '@nestjs/common'
import { fromDemarcheDtoToDemarche } from '../../application/queries/query-mappers/actions-pole-emploi.mappers'
import { isSuccess, Result, success } from '../../building-blocks/types/result'
import { Demarche } from '../../domain/demarche'
import { DateService } from '../../utils/date-service'
import { KeycloakClient } from '../clients/keycloak-client'
import {
  PoleEmploiPartenaire,
  PoleEmploiPartenaireClient
} from '../clients/pole-emploi-partenaire-client'

@Injectable()
export class DemarcheHttpRepositoryDb implements Demarche.Repository {
  constructor(
    private keycloakClient: KeycloakClient,
    @Inject(PoleEmploiPartenaire.PoleEmploiPartenaireClientToken)
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
