import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'

export class EvenementEngagementDto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id?: number

  @Column({ field: 'categorie', type: DataType.STRING })
  categorie: string | null

  @Column({ field: 'action', type: DataType.STRING })
  action: string

  @Column({ field: 'nom', type: DataType.STRING })
  nom: string | null

  @Column({ field: 'id_utilisateur', type: DataType.STRING })
  idUtilisateur: string

  @Column({ field: 'type_utilisateur', type: DataType.STRING })
  typeUtilisateur: Authentification.Type

  @Column({ field: 'structure', type: DataType.STRING })
  structure: Core.Structure

  @Column({ field: 'date_evenement', type: DataType.DATE })
  dateEvenement: Date
}

@Table({ timestamps: false, tableName: 'evenement_engagement' })
export class EvenementEngagementSqlModel extends EvenementEngagementDto {}
