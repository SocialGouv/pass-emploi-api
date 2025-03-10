import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique
} from 'sequelize-typescript'
import { JeuneSqlModel } from './jeune.sql-model'

@Table({
  timestamps: false,
  tableName: 'favori_offre_engagement'
})
export class FavoriOffreEngagementSqlModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    field: 'id',
    type: DataType.INTEGER
  })
  id: number

  @ForeignKey(() => JeuneSqlModel)
  @Unique({
    name: 'favori_offre_engagement_id_jeune_id_offre_unique',
    msg: 'Une offre ne peut être mise en favori qu’une fois pour un même jeune'
  })
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Unique({
    name: 'favori_offre_engagement_id_jeune_id_offre_unique',
    msg: 'Une offre ne peut être mise en favori qu’une fois pour un même jeune'
  })
  @Column({ field: 'id_offre' })
  idOffre: string

  @Column({ field: 'domaine' }) domaine: string

  @Column({ field: 'titre' }) titre: string

  @Column({ field: 'ville', type: DataType.STRING }) ville: string | null

  @Column({ field: 'organisation', type: DataType.STRING }) organisation:
    | string
    | null

  @Column({ field: 'date_de_debut', type: DataType.STRING }) dateDeDebut:
    | string
    | null

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation: Date

  @Column({ field: 'date_candidature', type: DataType.DATE })
  dateCandidature: Date | null
}
