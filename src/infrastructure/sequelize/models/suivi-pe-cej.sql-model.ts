import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

@Table({
  timestamps: false,
  tableName: 'jeune_pe_cej'
})
export class SuiviPeCejSqlModel extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.STRING
  })
  id: string
}
