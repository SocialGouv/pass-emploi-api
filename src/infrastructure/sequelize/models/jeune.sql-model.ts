import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Core } from '../../../domain/core'
import { AsSql } from '../types'
import { ActionSqlModel } from './action.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { RendezVousJeuneAssociationSqlModel } from './rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from './rendez-vous.sql-model'
import { SituationsMiloSqlModel } from './situations-milo.sql-model'
import { TransfertConseillerSqlModel } from './transfert-conseiller.sql-model'
import { StructureMiloSqlModel } from './structure-milo.sql-model'

export class JeuneDto extends Model {
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

  @ForeignKey(() => ConseillerSqlModel)
  @Column({
    field: 'id_conseiller',
    type: DataType.STRING
  })
  idConseiller?: string

  @Column({
    field: 'id_conseiller_initial',
    type: DataType.STRING
  })
  idConseillerInitial?: string | null

  @Column({
    field: 'date_creation',
    type: DataType.DATE
  })
  dateCreation: Date

  @Column({
    field: 'push_notification_token',
    type: DataType.STRING
  })
  pushNotificationToken: string | null

  @Column({
    field: 'date_derniere_actualisation_token',
    type: DataType.DATE
  })
  dateDerniereActualisationToken: Date | null

  @Column({
    field: 'date_fin_cej',
    type: DataType.DATE
  })
  dateFinCEJ: Date | null

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
    field: 'date_premiere_connexion',
    type: DataType.DATE
  })
  datePremiereConnexion: Date | null

  @Column({
    field: 'date_derniere_connexion',
    type: DataType.DATE
  })
  dateDerniereConnexion: Date | null

  @Column({
    field: 'id_partenaire',
    type: DataType.STRING
  })
  idPartenaire: string | null

  @Column({
    field: 'app_version',
    type: DataType.STRING
  })
  appVersion: string | null

  @Column({
    field: 'installation_id',
    type: DataType.STRING
  })
  installationId: string | null

  @Column({
    field: 'instance_id',
    type: DataType.STRING
  })
  instanceId: string | null

  @Column({
    field: 'timezone',
    type: DataType.STRING
  })
  timezone: string | null

  @Column({
    field: 'preferences_partage_favoris',
    type: DataType.BOOLEAN
  })
  partageFavoris: boolean

  @ForeignKey(() => StructureMiloSqlModel)
  @Column({
    field: 'id_structure_milo',
    type: DataType.STRING
  })
  idStructureMilo?: string | null

  @Column({
    field: 'date_signature_cgu',
    type: DataType.DATE
  })
  dateSignatureCGU: Date | null
}

@Table({
  timestamps: false,
  tableName: 'jeune'
})
export class JeuneSqlModel extends JeuneDto {
  @BelongsTo(() => ConseillerSqlModel)
  conseiller?: ConseillerSqlModel

  @BelongsToMany(
    () => RendezVousSqlModel,
    () => RendezVousJeuneAssociationSqlModel
  )
  rdv: RendezVousSqlModel[]

  @HasMany(() => ActionSqlModel)
  actions!: ActionSqlModel[]

  @HasMany(() => TransfertConseillerSqlModel)
  transferts: TransfertConseillerSqlModel[]

  @HasOne(() => SituationsMiloSqlModel)
  situations?: SituationsMiloSqlModel

  @BelongsTo(() => StructureMiloSqlModel)
  structureMilo?: StructureMiloSqlModel

  static async creer(jeuneDto: AsSql<JeuneDto>): Promise<JeuneSqlModel> {
    return JeuneSqlModel.create(jeuneDto)
  }

  static async supprimer(idJeune: string): Promise<void> {
    await JeuneSqlModel.destroy({ where: { id: idJeune } })
  }
}
