import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from 'src/domain/rendez-vous'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { TypesRendezVousQueryModel } from './query-models/rendez-vous.query-model'

@Injectable()
export class GetTypesRendezVousQueryHandler extends QueryHandler<
  Query,
  TypesRendezVousQueryModel
> {
  constructor() {
    super('GetTypesRendezvousQueryHandler')
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: Query
  ): Promise<TypesRendezVousQueryModel> {
    return Object.values(CodeTypeRendezVous).map(code => {
      return { code, label: mapCodeLabelTypeRendezVous[code] }
    })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
