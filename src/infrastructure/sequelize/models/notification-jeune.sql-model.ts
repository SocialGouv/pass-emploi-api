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

export class NotificationJeuneDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({
    field: 'id_jeune',
    type: DataType.STRING
  })
  idJeune: string

  @Column({
    field: 'date_notif',
    type: DataType.DATE
  })
  dateNotif: Date

  @Column({
    field: 'type',
    type: DataType.STRING
  })
  type: string

  @Column({
    field: 'titre',
    type: DataType.STRING
  })
  titre: string

  @Column({
    field: 'description',
    type: DataType.STRING
  })
  description: string
}

@Table({ timestamps: false, tableName: 'notification_jeune' })
export class NotificationJeuneSqlModel extends NotificationJeuneDto {
  @BelongsTo(() => JeuneSqlModel)
  jeune?: JeuneSqlModel
}
