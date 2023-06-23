import { Injectable } from '@nestjs/common'
import { SessionMilo } from 'src/domain/milo/session.milo'
import {
  SessionMiloDto,
  SessionMiloSqlModel
} from '../../sequelize/models/session-milo.sql-model'
import { AsSql } from '../../sequelize/types'

@Injectable()
export class SessionMiloSqlRepository implements SessionMilo.Repository {
  async save(session: SessionMilo): Promise<void> {
    const sessionMiloSqlModel: AsSql<SessionMiloDto> = {
      id: session.id,
      estVisible: session.estVisible,
      idStructureMilo: session.idStructureMilo,
      dateModification: session.dateModification.toJSDate()
    }

    await SessionMiloSqlModel.upsert(sessionMiloSqlModel)
  }
}
