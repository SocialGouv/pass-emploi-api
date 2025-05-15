import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { AsSql } from '../types'
import { CampagneSqlModel } from './campagne.sql-model'

export class ReponseCampagneDto extends Model {
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
  pourquoi1: string | null

  @Column({ field: 'reponse_2', type: DataType.STRING })
  reponse2: string | null

  @Column({ field: 'pourquoi_2', type: DataType.STRING })
  pourquoi2: string | null

  @Column({ field: 'reponse_3', type: DataType.STRING })
  reponse3: string | null

  @Column({ field: 'pourquoi_3', type: DataType.STRING })
  pourquoi3: string | null

  @Column({ field: 'reponse_4', type: DataType.STRING })
  reponse4: string | null

  @Column({ field: 'pourquoi_4', type: DataType.STRING })
  pourquoi4: string | null

  @Column({ field: 'reponse_5', type: DataType.STRING })
  reponse5: string | null

  @Column({ field: 'pourquoi_5', type: DataType.STRING })
  pourquoi5: string | null
}

@Table({ timestamps: false, tableName: 'reponse_campagne' })
export class ReponseCampagneSqlModel extends ReponseCampagneDto {
  static async inserer(
    modifications: AsSql<Omit<ReponseCampagneSqlModel, 'id'>>
  ): Promise<void> {
    await ReponseCampagneSqlModel.upsert(modifications)
  }
}
