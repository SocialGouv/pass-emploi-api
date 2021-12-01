import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class DepartementDto extends Model {
  @PrimaryKey
  @Column({ field: 'code', type: DataType.STRING })
  code!: string

  @Column({ field: 'libelle', type: DataType.STRING })
  libelle!: string
}

@Table({ timestamps: false, tableName: 'departement' })
export class DepartementSqlModel extends DepartementDto {
  score: number
}
