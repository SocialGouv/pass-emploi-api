import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { StructureMiloSqlModel } from './structure-milo.sql-model'

export class SessionMiloDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @Column({ field: 'est_visible', type: DataType.BOOLEAN })
  estVisible: boolean

  @Column({ field: 'autoinscription', type: DataType.BOOLEAN })
  autoinscription: boolean

  @Column({
    field: 'date_modification',
    type: DataType.DATE
  })
  dateModification: Date

  @Column({
    field: 'date_cloture',
    type: DataType.DATE
  })
  dateCloture: Date | null

  @ForeignKey(() => StructureMiloSqlModel)
  @Column({
    field: 'id_structure_milo',
    type: DataType.STRING
  })
  idStructureMilo: string
}

@Table({ timestamps: false, tableName: 'session_milo' })
export class SessionMiloSqlModel extends SessionMiloDto {
  @BelongsTo(() => StructureMiloSqlModel)
  structure?: StructureMiloSqlModel
}
