import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class CommuneDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id!: string

  @Column({ field: 'code', type: DataType.STRING })
  code!: string

  @Column({ field: 'libelle', type: DataType.STRING })
  libelle!: string

  @Column({ field: 'code_postal', type: DataType.STRING })
  codePostal!: string

  @Column({ field: 'code_departement', type: DataType.STRING })
  codeDepartement!: string
}

@Table({ timestamps: false, tableName: 'commune' })
export class CommuneSqlModel extends CommuneDto {
  score: number
}
