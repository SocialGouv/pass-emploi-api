import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
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
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Column({ field: 'id_offre' }) idOffre: string

  @Column({ field: 'metier' }) metier: string

  @Column({ field: 'ville' }) ville: string

  @Column({ field: 'nom_etablissement' }) nomEtablissement: string

  @Column({ field: 'secteur_activite' }) secteurActivite: string
}
