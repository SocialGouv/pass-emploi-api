import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class SuperviseurDto extends Model {
  @PrimaryKey
  @Column({ field: 'email', type: DataType.STRING })
  email: string
}

@Table({ timestamps: false, tableName: 'superviseur' })
export class SuperviseurSqlModel extends SuperviseurDto {}
