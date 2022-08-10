import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Action } from '../../../domain/action'
import { JeuneSqlModel } from './jeune.sql-model'

export class CommentaireDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id!: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_action', type: DataType.UUID })
  idAction!: string

  @Column({ field: 'date', type: DataType.DATE })
  date!: Date

  @Column({ field: 'createur', type: DataType.JSONB })
  createur!: {
    nom: string
    prenom: string
    id: string
    type: Action.TypeCreateur
  }

  @Column({ field: 'commentaire', type: DataType.STRING })
  commentaire!: string
}

@Table({ timestamps: false, tableName: 'commentaire' })
export class CommentaireSqlModel extends CommentaireDto {}
