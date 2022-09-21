import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from './jeune.sql-model'
import { Recherche } from '../../../domain/offre/recherche/recherche'

export class SuggestionDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.UUID })
  id!: string

  @Column({ field: 'id_fonctionnel', type: DataType.STRING })
  idFonctionnel!: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune!: string

  @Column({ field: 'type', type: DataType.STRING })
  type!: Recherche.Type

  @Column({ field: 'source', type: DataType.STRING })
  source!: Recherche.Suggestion.Source

  @Column({ field: 'titre', type: DataType.STRING })
  titre!: string

  @Column({ field: 'metier', type: DataType.STRING })
  metier!: string

  @Column({ field: 'localisation', type: DataType.STRING })
  localisation!: string

  @Column({ field: 'criteres', type: DataType.JSONB })
  criteres: Recherche.Emploi

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation: Date

  @Column({ field: 'date_mise_a_jour', type: DataType.DATE })
  dateMiseAJour: Date

  @Column({ field: 'date_suppression', type: DataType.DATE })
  dateSuppression: Date | null
}

@Table({ timestamps: false, tableName: 'suggestion' })
export class SuggestionSqlModel extends SuggestionDto {}
