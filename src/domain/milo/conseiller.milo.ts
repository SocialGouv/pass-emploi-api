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
  structure: ConseillerMilo.Structure
}

export namespace ConseillerMilo {
  export type Structure = { id: string; timezone: string }

  export interface Repository {
    get(idConseiller: string): Promise<Result<ConseillerMilo>>
    save(conseiller: { id: string; idStructure: string | null }): Promise<void>
    structureExiste(idStructure: string): Promise<boolean>
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
      accessToken: string
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
          accessToken
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

        const idStructure = structure.data.id.toString()
        const structureExiste =
          await this.conseillerMiloRepository.structureExiste(idStructure)

        if (!structureExiste) {
          this.logger.warn(
            `La structure ${idStructure} du conseiller Milo ${idConseiller} n'est pas présente dans le référentiel`
          )
          await this.conseillerMiloRepository.save({
            id: idConseiller,
            idStructure: null
          })
          return
        }

        await this.conseillerMiloRepository.save({
          id: idConseiller,
          idStructure
        })
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
