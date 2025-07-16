import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

export class ComptageJeuneDto extends Model {
  @PrimaryKey
  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune: string

  @Column({ field: 'heures_declarees', type: DataType.INTEGER })
  heuresDeclarees: number

  @Column({ field: 'heures_validees', type: DataType.INTEGER })
  heuresValidees: number

  @Column({ field: 'jour_debut', type: DataType.STRING })
  jourDebut: string

  @Column({ field: 'jour_fin', type: DataType.STRING })
  jourFin: string

  @Column({ field: 'date_mise_a_jour', type: DataType.DATE })
  dateMiseAJour: Date
}

@Table({
  timestamps: false,
  tableName: 'comptage_jeune'
})
export class ComptageJeuneSqlModel extends ComptageJeuneDto {
  @BelongsTo(() => JeuneSqlModel)
  jeune: JeuneSqlModel
}
