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

  @Unique({
    name: 'favori_offre_emploi_id_jeune_id_offre_unique',
    msg: 'Une offre ne peut être mise en favori qu’une fois pour un même jeune'
  })
  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Unique({
    name: 'favori_offre_emploi_id_jeune_id_offre_unique',
    msg: 'Une offre ne peut être mise en favori qu’une fois pour un même jeune'
  })
  @Column({ field: 'id_offre' })
  idOffre: string

  @Column({ field: 'titre' }) titre: string

  @Column({ field: 'type_contrat' }) typeContrat: string

  @Column({ field: 'nom_entreprise', type: DataType.STRING }) nomEntreprise:
    | string
    | null

  @Column({ field: 'duree', type: DataType.STRING }) duree: string | null

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

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation: Date

  @Column({ field: 'date_candidature', type: DataType.DATE })
  dateCandidature: Date | null

  @Column({ field: 'origine_nom', type: DataType.STRING })
  origineNom: string | null

  @Column({ field: 'origine_logo_url', type: DataType.STRING })
  origineLogoUrl: string | null
}
