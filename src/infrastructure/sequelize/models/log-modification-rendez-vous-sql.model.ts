import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { RendezVousSqlModel } from './rendez-vous.sql-model'

export class LogModificationRendezVousDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.UUID })
  id: string

  @ForeignKey(() => RendezVousSqlModel)
  @Column({ field: 'id_rendez_vous', type: DataType.UUID })
  idRendezVous: string

  @Column({ field: 'date', type: DataType.DATE })
  date: Date

  @Column({ field: 'auteur', type: DataType.JSONB })
  auteur: {
    id: string
    nom: string
    prenom: string
  }
}

@Table({ timestamps: false, tableName: 'log_modification_rendez_vous' })
export class LogModificationRendezVousSqlModel extends LogModificationRendezVousDto {
  @BelongsTo(() => RendezVousSqlModel)
  rendezVous: RendezVousSqlModel
}
