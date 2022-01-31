import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from './jeune.sql-model'

export class RendezVousDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id!: string

  @Column({ field: 'titre', type: DataType.STRING })
  titre!: string

  @Column({ field: 'sous_titre', type: DataType.STRING })
  sousTitre!: string

  @Column({ field: 'commentaire', type: DataType.STRING })
  commentaire: string | null

  @Column({ field: 'modalite', type: DataType.STRING })
  modalite!: string

  @Column({ field: 'date', type: DataType.DATE })
  date!: Date

  @Column({ field: 'duree', type: DataType.INTEGER })
  duree!: number

  @Column({ field: 'date_suppression', type: DataType.DATE })
  dateSuppression: Date | null

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune!: string
}

@Table({ timestamps: false, tableName: 'rendez_vous' })
export class RendezVousSqlModel extends RendezVousDto {
  @BelongsTo(() => JeuneSqlModel)
  jeune!: JeuneSqlModel
}
