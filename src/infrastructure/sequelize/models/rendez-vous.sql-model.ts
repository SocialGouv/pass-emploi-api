import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { CodeTypeRendezVous } from 'src/domain/rendez-vous'
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
  modalite: string | null

  @Column({ field: 'date', type: DataType.DATE })
  date!: Date

  @Column({ field: 'duree', type: DataType.INTEGER })
  duree!: number

  @Column({ field: 'date_suppression', type: DataType.DATE })
  dateSuppression: Date | null

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune!: string

  @Column({ field: 'type', type: DataType.STRING })
  type: CodeTypeRendezVous

  @Column({ field: 'precision', type: DataType.STRING })
  precision: string | null

  @Column({ field: 'adresse', type: DataType.STRING })
  adresse: string | null

  @Column({ field: 'organisme', type: DataType.STRING })
  organisme: string | null

  @Column({ field: 'presence_conseiller', type: DataType.BOOLEAN })
  presenceConseiller: boolean

  @Column({ field: 'invitation', type: DataType.BOOLEAN })
  invitation: boolean | null
}

@Table({ timestamps: false, tableName: 'rendez_vous' })
export class RendezVousSqlModel extends RendezVousDto {
  @BelongsTo(() => JeuneSqlModel)
  jeune!: JeuneSqlModel
}
