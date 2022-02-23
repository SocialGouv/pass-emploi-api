import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Core } from '../../../domain/core'

export class SuperviseurDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @Column({ field: 'email', type: DataType.STRING })
  email: string

  @Column({ field: 'structure', type: DataType.STRING })
  structure: Core.Structure
}

@Table({ timestamps: false, tableName: 'superviseur' })
export class SuperviseurSqlModel extends SuperviseurDto {}
