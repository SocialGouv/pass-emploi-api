import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Result,
  isFailure,
  isSuccess
} from '../../building-blocks/types/result'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../infrastructure/clients/milo-client'
import { StructureMiloSqlModel } from '../../infrastructure/sequelize/models/structure-milo.sql-model'
import { Conseiller } from '../conseiller/conseiller'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { buildError } from '../../utils/logger.module'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import * as APM from 'elastic-apm-node'

export const ConseillerMiloRepositoryToken = 'ConseillerMilo.Repository'

export interface ConseillerMilo {
  id: string
  idStructure: string
}

export namespace ConseillerMilo {
  export interface Repository {
    get(idConseiller: string): Promise<Result<ConseillerMilo>>
    update(conseiller: ConseillerMilo): Promise<void>
  }

  @Injectable()
  export class Factory {
    mettreAJourStructure(
      idConseiller: string,
      idStructure: string
    ): Conseiller.Milo {
      return {
        id: idConseiller,
        idStructure
      }
    }
  }
  @Injectable()
  export class Service {
    private logger: Logger
    private apmService: APM.Agent

    constructor(
      @Inject(ConseillerMiloRepositoryToken)
      private conseillerMiloRepository: Conseiller.Milo.Repository,
      private conseillerMiloFactory: Factory,
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
            resultConseiller.data.idStructure === structure.data.id.toString()
          if (structureConseillerNonModifiee) {
            return
          }
        }

        const conseillerMiloAvecStructure =
          this.conseillerMiloFactory.mettreAJourStructure(
            idConseiller,
            structure.data.id.toString()
          )

        await StructureMiloSqlModel.upsert({
          id: structure.data.id,
          nomOfficiel: structure.data.nomOfficiel,
          nomUsuel: structure.data.nomUsuel
        })
        await this.conseillerMiloRepository.update(conseillerMiloAvecStructure)
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
