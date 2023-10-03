import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { DateTime } from 'luxon'
import {
  Result,
  isFailure,
  isSuccess
} from '../../building-blocks/types/result'
import { StructureMiloDto } from '../../infrastructure/clients/dto/milo.dto'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../infrastructure/clients/milo-client'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { StructureMiloSqlModel } from '../../infrastructure/sequelize/models/structure-milo.sql-model'
import { AsSql } from '../../infrastructure/sequelize/types'
import { DateService } from '../../utils/date-service'
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
    save(conseiller: {
      id: string
      idStructure: string | null
      dateVerificationStructureMilo?: DateTime
    }): Promise<void>
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
      private keycloakClient: KeycloakClient,
      private dateService: DateService
    ) {
      this.logger = new Logger('ConseillerMiloService')
      this.apmService = getAPMInstance()
    }

    async recupererEtMettreAJourStructure(
      idConseiller: string,
      accessToken: string
    ): Promise<void> {
      try {
        const conseillerSql = await ConseillerSqlModel.findByPk(idConseiller)

        // Conseiller introuvable
        if (!conseillerSql) {
          return
        }

        const dateDerniereConnexion = DateService.fromJSDateToDateTime(
          conseillerSql.dateDerniereConnexion
        )
        const dateVerificationStructureMilo = DateService.fromJSDateToDateTime(
          conseillerSql.dateVerificationStructureMilo
        )
        const maintenant = this.dateService.now()
        const ilYa30s = maintenant.minus({ seconds: 30 })
        const ilYa24h = maintenant.minus({ hours: 24 })

        const moinsDe30sPasseesDepuisConnexion = dateDerniereConnexion
          ? dateDerniereConnexion > ilYa30s
          : true
        const passees24hDepuisVerification = dateVerificationStructureMilo
          ? dateVerificationStructureMilo < ilYa24h
          : true

        if (moinsDe30sPasseesDepuisConnexion || passees24hDepuisVerification) {
          const idpToken =
            await this.keycloakClient.exchangeTokenConseillerMilo(accessToken)
          const structure = await this.miloClient.getStructureConseiller(
            idpToken
          )

          if (isFailure(structure)) {
            return
          }

          const codeStructure = structure.data.code

          const structureModifiee =
            conseillerSql.idStructureMilo !== codeStructure
          if (structureModifiee) {
            const structureExiste =
              await this.conseillerMiloRepository.structureExiste(codeStructure)

            if (!structureExiste) {
              const codeStructureAjouteeOuNull =
                await this.ajouterLaNouvelleStructureSiInfosSuffisantes(
                  codeStructure
                )

              await this.conseillerMiloRepository.save({
                id: idConseiller,
                idStructure: codeStructureAjouteeOuNull,
                dateVerificationStructureMilo: maintenant
              })
              return
            }
          }

          await this.conseillerMiloRepository.save({
            id: idConseiller,
            idStructure: codeStructure,
            dateVerificationStructureMilo: maintenant
          })
        }
      } catch (e) {
        this.logger.error(
          buildError(
            `La récupération de la structure Milo du conseiller ${idConseiller} a échoué`,
            e
          )
        )
        this.apmService.captureError(e)
        if (e instanceof UnauthorizedException) {
          throw e
        }
      }
    }

    private async ajouterLaNouvelleStructureSiInfosSuffisantes(
      codeStructure: string
    ): Promise<string | null> {
      try {
        const prefixCodeStructureMilo = codeStructure.substring(0, 5)
        const structureMiloDtoResult =
          await this.miloClient.getStructureDuReferentiel(
            prefixCodeStructureMilo
          )

        if (isSuccess(structureMiloDtoResult)) {
          const structureACreer =
            await construireStructureSqlAvecInfosExistantes(
              codeStructure,
              structureMiloDtoResult.data
            )

          if (structureACreer) {
            await StructureMiloSqlModel.create(structureACreer)
            return codeStructure
          }
        }
      } catch (e) {
        this.logger.warn(e)
      }
      return null
    }
  }
}

async function construireStructureSqlAvecInfosExistantes(
  codeStructure: string,
  structureMiloDto: StructureMiloDto
): Promise<AsSql<StructureMiloSqlModel> | null> {
  const codePostal = structureMiloDto.adresse.codePostal
  const codeDepartement =
    codePostal?.substring(0, 2) ?? codeStructure.substring(0, 2)
  const structureDansLeDepartementSql = await StructureMiloSqlModel.findOne({
    where: {
      codeDepartement
    }
  })

  if (!structureDansLeDepartementSql) {
    return null
  }
  return {
    id: codeStructure,
    nomOfficiel: structureMiloDto.nomOfficiel,
    nomUsuel: structureMiloDto.nomUsuel,
    nomRegion: structureDansLeDepartementSql.nomRegion,
    codeRegion: structureDansLeDepartementSql.codeRegion,
    nomDepartement: structureDansLeDepartementSql.nomDepartement,
    codeDepartement: structureDansLeDepartementSql.codeDepartement,
    timezone: structureDansLeDepartementSql.timezone
  }
}
