import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Core } from '../../../domain/core'

export class AgenceDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.STRING
  })
  id: string

  @Column({
    field: 'nom_agence',
    type: DataType.STRING
  })
  nomAgence: string

  @Column({
    field: 'nom_region',
    type: DataType.STRING
  })
  nomRegion: string

  @Column({
    field: 'code_region',
    type: DataType.STRING
  })
  codeRegion: string | null

  @Column({
    field: 'nom_departement',
    type: DataType.STRING
  })
  nomDepartement: string | null

  @Column({
    field: 'code_departement',
    type: DataType.STRING
  })
  codeDepartement: string

  @Column({
    field: 'structure',
    type: DataType.STRING
  })
  structure: Core.Structure

  @Column({
    field: 'timezone',
    type: DataType.STRING
  })
  timezone: string
}

@Table({
  timestamps: false,
  tableName: 'agence'
})
export class AgenceSqlModel extends AgenceDto {}
