import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { AsSql } from '../types'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { JeuneSqlModel } from './jeune.sql-model'

export class TransfertConseillerDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.STRING
  })
  id: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Column({ field: 'email_jeune', type: DataType.STRING })
  emailJeune: string | null

  @ForeignKey(() => ConseillerSqlModel)
  @Column({ field: 'id_conseiller_source' })
  idConseillerSource: string

  @ForeignKey(() => ConseillerSqlModel)
  @Column({ field: 'id_conseiller_cible' })
  idConseillerCible: string

  @ForeignKey(() => ConseillerSqlModel)
  @Column({
    field: 'id_conseiller_qui_transfert',
    type: DataType.STRING
  })
  idConseillerQuiTransfert: string | null

  @Column({
    field: 'date_transfert',
    type: DataType.DATE
  })
  dateTransfert: Date

  @Column({
    field: 'type_transfert',
    type: DataType.STRING
  })
  typeTransfert: string | null
}

@Table({
  timestamps: false,
  tableName: 'transfert_conseiller'
})
export class TransfertConseillerSqlModel extends TransfertConseillerDto {
  @BelongsTo(() => ConseillerSqlModel, {
    foreignKey: {
      name: 'id_conseiller_source'
    }
  })
  conseillerSource: ConseillerSqlModel

  @BelongsTo(() => ConseillerSqlModel, {
    foreignKey: {
      name: 'id_conseiller_cible'
    }
  })
  conseillerCible: ConseillerSqlModel

  static async creer(
    transfertConseillerDto: AsSql<TransfertConseillerDto>
  ): Promise<void> {
    await TransfertConseillerSqlModel.create(transfertConseillerDto)
  }
}
