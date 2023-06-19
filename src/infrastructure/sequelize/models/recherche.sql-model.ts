import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Polygon } from 'geojson'
import { Recherche } from '../../../domain/offre/recherche/recherche'
import { JeuneSqlModel } from './jeune.sql-model'
import { Offre } from '../../../domain/offre/offre'

export class RechercheDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Column({ field: 'type', type: DataType.STRING })
  type: Recherche.Type

  @Column({ field: 'titre', type: DataType.STRING })
  titre: string

  @Column({ field: 'metier', type: DataType.STRING })
  metier: string | null

  @Column({ field: 'localisation', type: DataType.STRING })
  localisation: string | null

  @Column({ field: 'criteres', type: DataType.JSONB })
  criteres:
    | Offre.Recherche.Emploi
    | Offre.Recherche.Immersion
    | Offre.Recherche.ServiceCivique

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation: Date

  @Column({ field: 'date_derniere_recherche', type: DataType.DATE })
  dateDerniereRecherche: Date

  @Column({ field: 'etat_derniere_recherche', type: DataType.STRING })
  etatDerniereRecherche: Recherche.Etat

  @Column({
    field: 'geometrie',
    type: DataType.GEOMETRY('POLYGON', Recherche.Geometrie.PROJECTION_WGS84)
  })
  geometrie: Polygon
}

@Table({ timestamps: false, tableName: 'recherche' })
export class RechercheSqlModel extends RechercheDto {}
