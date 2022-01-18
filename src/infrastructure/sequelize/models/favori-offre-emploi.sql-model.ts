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
  tableName: 'favori_offre_emploi'
})
export class FavoriOffreEmploiSqlModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    field: 'id',
    type: DataType.INTEGER
  })
  id?: number

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Column({ field: 'id_offre' }) idOffre: string

  @Column({ field: 'titre' }) titre: string

  @Column({ field: 'type_contrat' }) typeContrat: string

  @Column({ field: 'nom_entreprise' }) nomEntreprise: string

  @Column({ field: 'duree' }) duree: string

  @Column({
    field: 'is_alternance',
    type: DataType.BOOLEAN
  })
  isAlternance: boolean | null

  @Column({
    field: 'localisation_nom',
    type: DataType.STRING
  })
  nomLocalisation: string | null

  @Column({
    field: 'localisation_code_postal',
    type: DataType.STRING
  })
  codePostalLocalisation: string | null

  @Column({
    field: 'localisation_commune',
    type: DataType.STRING
  })
  communeLocalisation: string | null
}
