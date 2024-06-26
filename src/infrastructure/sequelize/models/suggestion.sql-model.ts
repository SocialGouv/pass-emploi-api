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
import { RechercheSqlModel } from './recherche.sql-model'

export class SuggestionDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.UUID })
  id: string

  @Column({ field: 'id_fonctionnel', type: DataType.STRING })
  idFonctionnel: string | null

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune: string

  @Column({ field: 'type', type: DataType.STRING })
  type: Recherche.Type

  @Column({ field: 'source', type: DataType.STRING })
  source: Recherche.Suggestion.Source

  @Column({ field: 'titre', type: DataType.STRING })
  titre: string

  @Column({ field: 'metier', type: DataType.STRING })
  metier: string | null

  @Column({ field: 'localisation', type: DataType.STRING })
  localisation: string | null

  @Column({ field: 'criteres', type: DataType.JSONB })
  criteres:
    | Recherche.Emploi
    | Recherche.Immersion
    | Recherche.ServiceCivique
    | null

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation: Date

  @Column({ field: 'date_rafraichissement', type: DataType.DATE })
  dateRafraichissement: Date

  @Column({ field: 'date_refus', type: DataType.DATE })
  dateRefus: Date | null

  @Column({ field: 'date_creation_recherche', type: DataType.DATE })
  dateCreationRecherche: Date | null

  @ForeignKey(() => RechercheSqlModel)
  @Column({ field: 'id_recherche', type: DataType.UUID })
  idRecherche: string | null
}

@Table({ timestamps: false, tableName: 'suggestion' })
export class SuggestionSqlModel extends SuggestionDto {}
