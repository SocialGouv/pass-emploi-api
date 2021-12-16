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
import { Core } from '../../../domain/core'
import { AsSql } from '../types'
import { ActionSqlModel } from './action.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { RendezVousSqlModel } from './rendez-vous.sql-model'

export class JeuneDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id!: string

  @Column({ field: 'nom', type: DataType.STRING })
  nom!: string

  @Column({ field: 'prenom', type: DataType.STRING })
  prenom!: string

  @ForeignKey(() => ConseillerSqlModel)
  @Column({ field: 'id_conseiller', type: DataType.STRING })
  idConseiller!: string

  @Column({ field: 'date_creation', type: DataType.DATE })
  dateCreation!: Date

  @Column({ field: 'push_notification_token', type: DataType.STRING })
  pushNotificationToken!: string | null

  @Column({ field: 'date_derniere_actualisation_token', type: DataType.DATE })
  dateDerniereActualisationToken!: Date | null

  @Column({ field: 'email', type: DataType.STRING })
  email: string | null

  @Column({ field: 'structure', type: DataType.STRING })
  structure: Core.Structure

  @Column({ field: 'id_authentification', type: DataType.STRING })
  idAuthentification: string
}

@Table({ timestamps: false, tableName: 'jeune' })
export class JeuneSqlModel extends JeuneDto {
  @BelongsTo(() => ConseillerSqlModel)
  conseiller!: ConseillerSqlModel

  @HasMany(() => RendezVousSqlModel)
  rendezVous!: RendezVousSqlModel[]

  @HasMany(() => ActionSqlModel)
  actions!: ActionSqlModel[]

  static async creer(jeuneDto: AsSql<JeuneDto>): Promise<void> {
    await JeuneSqlModel.create(jeuneDto)
  }
}
