import { Injectable } from '@nestjs/common'
import {
  FeatureFlipSqlModel,
  FeatureFlipTag
} from '../../../infrastructure/sequelize/models/feature-flip.sql-model'

export interface GetFeaturesQuery {
  idJeune: string
  featureTag: FeatureFlipTag
}

@Injectable()
export class GetFeaturesQueryGetter {
  async handle(query: GetFeaturesQuery): Promise<boolean> {
    const feature = await FeatureFlipSqlModel.findOne({
      where: {
        idJeune: query.idJeune,
        featureTag: query.featureTag
      }
    })
    return !!feature
  }
}
