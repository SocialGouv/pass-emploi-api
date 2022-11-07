import { Injectable } from '@nestjs/common'
import { RendezVous } from '../../../domain/rendez-vous'
import {
  LogModificationRendezVousDto,
  LogModificationRendezVousSqlModel
} from '../../sequelize/models/log-modification-rendez-vous-sql.model'
import { AsSql } from '../../sequelize/types'

@Injectable()
export class HistoriqueRendezVousRepositorySql
  implements RendezVous.Historique.Repository
{
  async save(
    logModification: RendezVous.Historique.LogModification
  ): Promise<void> {
    const logModificationSql: AsSql<LogModificationRendezVousDto> =
      logModification

    await LogModificationRendezVousSqlModel.create(logModificationSql)
  }
}
