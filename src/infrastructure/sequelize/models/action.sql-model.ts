import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Action } from '../../../domain/action/action'
import { AsSql } from '../types'
import { JeuneSqlModel } from './jeune.sql-model'
import { CommentaireSqlModel } from './commentaire.sql-model'

export class ActionDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.UUID })
  id!: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune!: string

  @Column({ field: 'id_createur', type: DataType.STRING })
  idCreateur!: string

  @Column({ field: 'createur', type: DataType.JSONB })
  createur: {
    nom: string
    prenom: string
    id: string
  }

  @Column({ field: 'type_createur', type: DataType.STRING })
  typeCreateur!: Action.TypeCreateur

  @Column({ field: 'contenu', type: DataType.STRING(1024) })
  contenu!: string

  @Column({ field: 'description', type: DataType.STRING(2048) })
  description!: string

  @Column({ field: 'statut', type: DataType.STRING })
  statut!: Action.Statut

  @Column({ field: 'est_visible_par_conseiller', type: DataType.BOOLEAN })
  estVisibleParConseiller!: boolean

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation!: Date

  @Column({ field: 'date_derniere_actualisation', type: DataType.DATE })
  dateDerniereActualisation!: Date

  @Column({ field: 'date_echeance', type: DataType.DATE })
  dateEcheance: Date

  @Column({ field: 'rappel', type: DataType.BOOLEAN })
  rappel: boolean

  @Column({ field: 'date_debut', type: DataType.DATE })
  dateDebut: Date | null

  @Column({ field: 'date_fin_reelle', type: DataType.DATE })
  dateFinReelle: Date | null

  @Column({ field: 'qualification_code', type: DataType.STRING })
  codeQualification: Action.Qualification.Code | null

  @Column({ field: 'qualification_heures', type: DataType.INTEGER })
  heuresQualifiees: number | null

  @Column({ field: 'qualification_commentaire', type: DataType.STRING })
  commentaireQualification: string | null
}

@Table({ timestamps: false, tableName: 'action' })
export class ActionSqlModel extends ActionDto {
  @BelongsTo(() => JeuneSqlModel)
  jeune!: JeuneSqlModel

  @HasMany(() => CommentaireSqlModel)
  commentaires!: CommentaireSqlModel[]

  static async creer(actionDto: AsSql<ActionDto>): Promise<void> {
    await ActionSqlModel.create(actionDto)
  }

  static async modifierOuCreer(modifications: AsSql<ActionDto>): Promise<void> {
    await ActionSqlModel.upsert(modifications)
  }
}
