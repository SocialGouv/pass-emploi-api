import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class StructureMiloDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.STRING
  })
  id: string

  @Column({
    field: 'nom_officiel',
    type: DataType.STRING
  })
  nomOfficiel: string

  @Column({
    field: 'nom_usuel',
    type: DataType.STRING
  })
  nomUsuel: string | null
}

@Table({
  timestamps: false,
  tableName: 'structure_milo'
})
export class StructureMiloSqlModel extends StructureMiloDto {}
