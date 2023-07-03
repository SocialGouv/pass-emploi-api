import { Inject, Injectable, Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  isFailure,
  isSuccess
} from '../../building-blocks/types/result'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../infrastructure/clients/milo-client'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import { buildError } from '../../utils/logger.module'
import { Conseiller } from '../conseiller/conseiller'

export const ConseillerMiloRepositoryToken = 'ConseillerMilo.Repository'

export interface ConseillerMilo {
  id: string
  structure: { id: string; timezone: string }
}

export namespace ConseillerMilo {
  export interface Repository {
    get(idConseiller: string): Promise<Result<ConseillerMilo>>
    save(conseiller: AvecStructure): Promise<void>
  }

  export interface AvecStructure {
    id: string
    idStructure: string
  }

  @Injectable()
  export class Service {
    private logger: Logger
    private apmService: APM.Agent

    constructor(
      @Inject(ConseillerMiloRepositoryToken)
      private conseillerMiloRepository: Conseiller.Milo.Repository,
      private miloClient: MiloClient,
      private keycloakClient: KeycloakClient
    ) {
      this.logger = new Logger('ConseillerMiloService')
      this.apmService = getAPMInstance()
    }

    async recupererEtMettreAJourStructure(
      idConseiller: string,
      token: string
    ): Promise<void> {
      try {
        const resultConseiller = await this.conseillerMiloRepository.get(
          idConseiller
        )

        // Conseiller introuvable
        if (
          isFailure(resultConseiller) &&
          resultConseiller.error.code === NonTrouveError.CODE
        ) {
          return
        }

        const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
          token
        )
        const structure = await this.miloClient.getStructureConseiller(idpToken)

        if (isFailure(structure)) {
          return
        }

        // Conseiller trouvé mais structure Milo non modifiée
        if (isSuccess(resultConseiller)) {
          const structureConseillerNonModifiee =
            resultConseiller.data.structure.id === structure.data.id.toString()
          if (structureConseillerNonModifiee) {
            return
          }
        }

        const conseillerMiloAvecStructure = {
          id: idConseiller,
          idStructure: structure.data.id.toString()
        }
        await this.conseillerMiloRepository.save(conseillerMiloAvecStructure)
      } catch (e) {
        this.logger.error(
          buildError(
            `La récupération de la structure Milo du conseiller ${idConseiller} a échoué`,
            e
          )
        )
        this.apmService.captureError(e)
      }
    }
  }
}
