import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
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

  @AllowNull
  @Column({ field: 'push_notification_token', type: DataType.STRING })
  pushNotificationToken!: string | null

  @AllowNull
  @Column({ field: 'date_derniere_actualisation_token', type: DataType.DATE })
  dateDerniereActualisationToken!: Date | null
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
