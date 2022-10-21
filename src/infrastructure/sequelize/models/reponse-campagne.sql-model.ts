import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { CampagneSqlModel } from './campagne.sql-model'

export class ReponseCampagneDto extends Model {
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id: number

  @PrimaryKey
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Column({ field: 'structure_jeune' })
  structureJeune: string

  @PrimaryKey
  @ForeignKey(() => CampagneSqlModel)
  @Column({ field: 'id_campagne' })
  idCampagne: string

  @Column({ field: 'date_reponse', type: DataType.DATE })
  dateReponse: Date

  @Column({ field: 'date_creation_jeune', type: DataType.DATE })
  dateCreationJeune: Date

  @Column({ field: 'reponse_1', type: DataType.STRING })
  reponse1: string

  @Column({ field: 'pourquoi_1', type: DataType.STRING })
  pourquoi1?: string | null

  @Column({ field: 'reponse_2', type: DataType.STRING })
  reponse2?: string | null

  @Column({ field: 'pourquoi_2', type: DataType.STRING })
  pourquoi2?: string | null

  @Column({ field: 'reponse_3', type: DataType.STRING })
  reponse3?: string | null

  @Column({ field: 'pourquoi_3', type: DataType.STRING })
  pourquoi3: string | null
}

@Table({ timestamps: false, tableName: 'reponse_campagne' })
export class ReponseCampagneSqlModel extends ReponseCampagneDto {}
