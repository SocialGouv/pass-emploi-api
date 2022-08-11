import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Action } from '../../../domain/action/action'
import { ActionSqlModel } from './action.sql-model'

export class CommentaireDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id!: string

  @ForeignKey(() => ActionSqlModel)
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

  @Column({ field: 'message', type: DataType.STRING })
  message!: string
}

@Table({ timestamps: false, tableName: 'commentaire_action' })
export class CommentaireSqlModel extends CommentaireDto {
  @BelongsTo(() => ActionSqlModel)
  action!: ActionSqlModel
}
