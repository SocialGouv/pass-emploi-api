import { Injectable } from '@nestjs/common'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../../infrastructure/clients/milo-client'
import { DateTime } from 'luxon'
import {
  isFailure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { ListeSessionsConseillerMiloDto } from '../../../../infrastructure/clients/dto/milo.dto'

@Injectable()
export class GetSessionsConseillerMiloQueryGetter {
  constructor(
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient
  ) {}

  async handle(
    token: string,
    idStructure: string,
    timezoneStructure: string,
    options?: {
      periode?: { debut: DateTime; fin: DateTime }
      filtrerAClore?: boolean
    }
  ): Promise<Result<ListeSessionsConseillerMiloDto>> {
    // TODO changer le typage  du handle pour renvoyer un query model et pas un DTO
    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      token
    )

    // todo gerer les params + pagination
    const resultSessionMiloClient: Result<ListeSessionsConseillerMiloDto> =
      await this.miloClient.getSessionsConseiller(
        idpToken,
        idStructure,
        timezoneStructure
      )

    if (isFailure(resultSessionMiloClient)) {
      return resultSessionMiloClient
    }

    if (options?.filtrerAClore)
      return success(trierSessionsAClore(resultSessionMiloClient.data))
    return success(resultSessionMiloClient.data)
  }
}

function trierSessionsAClore(
  listeSessionsConseillerMiloDto: ListeSessionsConseillerMiloDto
): ListeSessionsConseillerMiloDto {
  // todo filtrer si date de debut passée
  return {
    ...listeSessionsConseillerMiloDto,
    sessions: listeSessionsConseillerMiloDto.sessions
  }
}
