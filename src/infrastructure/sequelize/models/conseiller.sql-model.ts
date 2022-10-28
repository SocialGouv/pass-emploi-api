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
import { JeuneSqlModel } from './jeune.sql-model'
import { AgenceSqlModel } from './agence.sql-model'

export class ConseillerDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.STRING
  })
  id: string

  @Column({
    field: 'nom',
    type: DataType.STRING
  })
  nom: string

  @Column({
    field: 'prenom',
    type: DataType.STRING
  })
  prenom: string

  @Column({
    field: 'email',
    type: DataType.STRING
  })
  email: string | null

  @Column({
    field: 'structure',
    type: DataType.STRING
  })
  structure: Core.Structure

  @Column({
    field: 'id_authentification',
    type: DataType.STRING
  })
  idAuthentification: string

  @Column({
    field: 'date_creation',
    type: DataType.DATE
  })
  dateCreation: Date

  @Column({
    field: 'date_verification_messages',
    type: DataType.DATE
  })
  dateVerificationMessages: Date

  @Column({
    field: 'date_derniere_connexion',
    type: DataType.DATE
  })
  dateDerniereConnexion: Date | null

  @ForeignKey(() => AgenceSqlModel)
  @Column({
    field: 'id_agence',
    type: DataType.STRING
  })
  idAgence?: string | null

  @Column({
    field: 'nom_manuel_agence',
    type: DataType.STRING
  })
  nomManuelAgence?: string

  @Column({
    field: 'notifications_sonores',
    type: DataType.BOOLEAN
  })
  notificationsSonores: boolean
}

@Table({
  timestamps: false,
  tableName: 'conseiller'
})
export class ConseillerSqlModel extends ConseillerDto {
  @HasMany(() => JeuneSqlModel)
  jeunes!: JeuneSqlModel[]

  @BelongsTo(() => AgenceSqlModel, 'id_agence')
  agence?: AgenceSqlModel

  static async creer(conseillerDto: AsSql<ConseillerDto>): Promise<void> {
    await ConseillerSqlModel.create(conseillerDto)
  }
}
