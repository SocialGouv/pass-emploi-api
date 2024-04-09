import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

@Table({
  timestamps: false,
  tableName: 'jeune_milo_a_archiver'
})
export class JeuneMiloAArchiverSqlModel extends Model {
  @PrimaryKey
  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @BelongsTo(() => JeuneSqlModel)
  jeune: JeuneSqlModel
}
