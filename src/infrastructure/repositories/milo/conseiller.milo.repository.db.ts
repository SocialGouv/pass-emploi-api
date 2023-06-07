import { Injectable } from '@nestjs/common'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { Result, failure, success } from '../../../building-blocks/types/result'
import {
  ConseillerMiloSansStructure,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'

@Injectable()
export class ConseillerMiloSqlRepository implements Conseiller.Milo.Repository {
  async get(id: string): Promise<Result<Conseiller.Milo>> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel) {
      return failure(new NonTrouveError('Conseiller Milo', id))
    }

    if (!conseillerSqlModel.idStructureMilo) {
      return failure(new ConseillerMiloSansStructure(id))
    }
    return success({
      id,
      idStructure: conseillerSqlModel.idStructureMilo
    })
  }
  async update(conseiller: Conseiller.Milo): Promise<void> {
    await ConseillerSqlModel.update(
      {
        idStructureMilo: conseiller.idStructure
      },
      { where: { id: conseiller.id } }
    )
  }
}
