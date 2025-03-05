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
  tableName: 'favori_offre_immersion'
})
export class FavoriOffreImmersionSqlModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    field: 'id',
    type: DataType.INTEGER
  })
  id: number

  @ForeignKey(() => JeuneSqlModel)
  @Unique({
    name: 'favori_offre_immersion_id_jeune_id_offre_unique',
    msg: 'Une offre ne peut être mise en favori qu’une fois pour un même jeune'
  })
  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Unique({
    name: 'favori_offre_immersion_id_jeune_id_offre_unique',
    msg: 'Une offre ne peut être mise en favori qu’une fois pour un même jeune'
  })
  @Column({ field: 'id_offre' })
  idOffre: string

  @Column({ field: 'metier' }) metier: string

  @Column({ field: 'ville' }) ville: string

  @Column({ field: 'nom_etablissement' }) nomEtablissement: string

  @Column({ field: 'secteur_activite' }) secteurActivite: string

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation: Date

  @Column({ field: 'date_candidature', type: DataType.DATE })
  dateCandidature: Date | null
}
