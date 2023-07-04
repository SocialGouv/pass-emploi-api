import { Injectable } from '@nestjs/common'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { Result, failure, success } from '../../../building-blocks/types/result'
import {
  ConseillerMiloSansStructure,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import { StructureMiloSqlModel } from '../../sequelize/models/structure-milo.sql-model'

@Injectable()
export class ConseillerMiloSqlRepository implements Conseiller.Milo.Repository {
  async get(id: string): Promise<Result<Conseiller.Milo>> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id, {
      include: [{ model: StructureMiloSqlModel, required: true }]
    })
    if (!conseillerSqlModel) {
      return failure(new NonTrouveError('Conseiller Milo', id))
    }

    if (!conseillerSqlModel.idStructureMilo) {
      return failure(new ConseillerMiloSansStructure(id))
    }
    return success({
      id,
      structure: {
        id: conseillerSqlModel.structureMilo!.id,
        timezone: conseillerSqlModel.structureMilo!.timezone
      }
    })
  }

  async save(conseiller: { id: string; idStructure: string }): Promise<void> {
    await ConseillerSqlModel.update(
      {
        idStructureMilo: conseiller.idStructure
      },
      { where: { id: conseiller.id } }
    )
  }
}
