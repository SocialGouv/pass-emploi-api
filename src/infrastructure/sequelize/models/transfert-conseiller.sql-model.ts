import {
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

  @ForeignKey(() => ConseillerSqlModel)
  @Column({ field: 'id_conseiller_source' })
  idConseillerSource: string

  @ForeignKey(() => ConseillerSqlModel)
  @Column({ field: 'id_conseiller_cible' })
  idConseillerCible: string

  @Column({
    field: 'date_transfert',
    type: DataType.DATE
  })
  dateTransfert: Date
}

@Table({
  timestamps: false,
  tableName: 'transfert_conseiller'
})
export class TransfertConseillerSqlModel extends TransfertConseillerDto {
  static async creer(
    transfertConseillerDto: AsSql<TransfertConseillerDto>
  ): Promise<void> {
    await TransfertConseillerSqlModel.create(transfertConseillerDto)
  }
}
