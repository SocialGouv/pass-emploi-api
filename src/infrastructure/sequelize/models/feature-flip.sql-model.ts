import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from './jeune.sql-model'

export enum FeatureFlipTag {
  DEMARCHES_IA = 'DEMARCHES_IA',
  MIGRATION_GIRONDE = 'MIGRATION_GIRONDE'
}
@Table({
  timestamps: false,
  tableName: 'feature_flip'
})
export class FeatureFlipSqlModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    field: 'id',
    type: DataType.INTEGER
  })
  id: number

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune: string

  @Column({ field: 'feature_tag', type: DataType.STRING })
  featureTag: FeatureFlipTag
}
