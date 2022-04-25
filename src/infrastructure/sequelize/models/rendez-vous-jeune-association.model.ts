import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { RendezVousSqlModel } from './rendez-vous.sql-model'
import { JeuneSqlModel } from './jeune.sql-model'

@Table({ timestamps: false, tableName: 'rendez_vous_jeune_association' })
export class RendezVousJeuneAssociationModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id: number

  @ForeignKey(() => RendezVousSqlModel)
  @Column({ field: 'id_rendez_vous', type: DataType.STRING })
  idRendezVous: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune: string
}
