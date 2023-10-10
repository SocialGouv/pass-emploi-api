import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class MetierRomeDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.INTEGER })
  id!: number

  @Column({ field: 'code', type: DataType.STRING })
  code!: string

  @Column({ field: 'libelle', type: DataType.STRING })
  libelle!: string

  @Column({ field: 'libelle_sanitized', type: DataType.STRING })
  libelleSanitized!: string

  @Column({ field: 'appellation_code', type: DataType.STRING })
  appellationCode!: string
}

@Table({ timestamps: false, tableName: 'referentiel_metier_rome' })
export class MetierRomeSqlModel extends MetierRomeDto {
  score: number
}
