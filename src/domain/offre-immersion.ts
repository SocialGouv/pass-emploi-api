import { OffresImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-models'

export const OffresImmersionRepositoryToken = 'OffresImmersion.Repository'

export namespace OffresImmersion {
  export interface Repository {
    findAll(metier?: string, ville?: string): Promise<OffresImmersionQueryModel>
  }
}
