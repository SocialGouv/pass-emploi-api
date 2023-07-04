import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class StructureMiloDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.STRING
  })
  id: string

  @Column({
    field: 'nom_officiel',
    type: DataType.STRING
  })
  nomOfficiel: string

  @Column({
    field: 'nom_usuel',
    type: DataType.STRING
  })
  nomUsuel: string | null

  @Column({
    field: 'nom_region',
    type: DataType.STRING
  })
  nomRegion: string | null

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
  codeDepartement: string | null

  @Column({
    field: 'timezone',
    type: DataType.STRING
  })
  timezone: string
}

@Table({
  timestamps: false,
  tableName: 'structure_milo'
})
export class StructureMiloSqlModel extends StructureMiloDto {}
