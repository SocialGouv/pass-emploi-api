import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { ReponseCampagneSqlModel } from './reponse-campagne.sql-model'

export class CampagneDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @Column({ field: 'date_debut', type: DataType.DATE })
  dateDebut: Date

  @Column({ field: 'date_fin', type: DataType.DATE })
  dateFin: Date

  @Column({ field: 'nom', type: DataType.STRING })
  nom: string
}

@Table({ timestamps: false, tableName: 'campagne' })
export class CampagneSqlModel extends CampagneDto {
  @HasMany(() => ReponseCampagneSqlModel)
  reponses!: ReponseCampagneSqlModel[]
}
