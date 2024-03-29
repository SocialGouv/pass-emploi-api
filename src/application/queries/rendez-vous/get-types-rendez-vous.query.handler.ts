import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import {
  CategorieRendezVous,
  CodeTypeRendezVous,
  mapCodeCategorieTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { TypeRendezVousQueryModel } from '../query-models/rendez-vous.query-model'

@Injectable()
export class GetTypesRendezVousQueryHandler extends QueryHandler<
  Query,
  TypeRendezVousQueryModel[]
> {
  constructor() {
    super('GetTypesRendezvousQueryHandler')
  }

  async handle(_query: Query): Promise<TypeRendezVousQueryModel[]> {
    return Object.values(CodeTypeRendezVous)
      .map(code => {
        return {
          code,
          categorie: mapCodeCategorieTypeRendezVous[code],
          label: mapCodeLabelTypeRendezVous[code]
        }
      })
      .filter(type => type.categorie !== CategorieRendezVous.MILO)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
