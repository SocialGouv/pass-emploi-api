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
  @Column({ field: 'email', type: DataType.STRING })
  email: string

  @PrimaryKey
  @Column({ field: 'structure', type: DataType.STRING })
  structure: Core.Structure
}

@Table({ timestamps: false, tableName: 'superviseur' })
export class SuperviseurSqlModel extends SuperviseurDto {}
