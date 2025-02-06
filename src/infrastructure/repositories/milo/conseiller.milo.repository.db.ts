import { Injectable } from '@nestjs/common'
import {
  ConseillerMiloSansStructure,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../../building-blocks/types/result'
import { Conseiller } from '../../../domain/milo/conseiller'
import { ConseillerMiloModifie } from '../../../domain/milo/conseiller.milo.db'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { StructureMiloSqlModel } from '../../sequelize/models/structure-milo.sql-model'

@Injectable()
export class ConseillerMiloSqlRepository implements Conseiller.Milo.Repository {
  async get(id: string): Promise<Result<Conseiller.Milo>> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id, {
      include: [{ model: StructureMiloSqlModel, required: false }]
    })
    if (!conseillerSqlModel) {
      return failure(new NonTrouveError('Conseiller Milo', id))
    }

    if (
      !conseillerSqlModel.idStructureMilo ||
      !conseillerSqlModel.structureMilo
    ) {
      return failure(new ConseillerMiloSansStructure(id))
    }

    return success({
      id,
      structure: {
        id: conseillerSqlModel.structureMilo.id,
        timezone: conseillerSqlModel.structureMilo.timezone
      }
    })
  }

  async save(conseiller: ConseillerMiloModifie): Promise<void> {
    await ConseillerSqlModel.update(
      {
        idAgence: conseiller.idAgence,
        idStructureMilo: conseiller.idStructure,
        dateVerificationStructureMilo:
          conseiller.dateVerificationStructureMilo?.toJSDate()
      },
      { where: { id: conseiller.id } }
    )
  }

  async structureExiste(idStructure: string): Promise<boolean> {
    const structureExistante = await StructureMiloSqlModel.findByPk(idStructure)
    return Boolean(structureExistante)
  }
}
