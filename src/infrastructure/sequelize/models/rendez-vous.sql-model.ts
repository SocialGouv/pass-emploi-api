import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { AgenceSqlModel } from './agence.sql-model'
import { JeuneSqlModel } from './jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from './rendez-vous-jeune-association.sql-model'
import { LogModificationRendezVousSqlModel } from './log-modification-rendez-vous-sql.model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export class RendezVousDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @Column({ field: 'source', type: DataType.STRING })
  source: RendezVous.Source

  @Column({ field: 'titre', type: DataType.STRING })
  titre: string

  @Column({ field: 'sous_titre', type: DataType.STRING })
  sousTitre: string

  @Column({ field: 'commentaire', type: DataType.STRING })
  commentaire: string | null

  @Column({ field: 'modalite', type: DataType.STRING })
  modalite: string | null

  @Column({ field: 'date', type: DataType.DATE })
  date: Date

  @Column({ field: 'duree', type: DataType.INTEGER })
  duree: number

  @Column({ field: 'date_suppression', type: DataType.DATE })
  dateSuppression: Date | null

  @Column({ field: 'date_cloture', type: DataType.DATE })
  dateCloture: Date | null

  @Column({ field: 'type', type: DataType.STRING })
  type: CodeTypeRendezVous

  @Column({ field: 'precision', type: DataType.STRING })
  precision: string | null

  @Column({ field: 'adresse', type: DataType.STRING })
  adresse: string | null

  @Column({ field: 'ics_sequence', type: DataType.INTEGER })
  icsSequence: number | null

  @Column({ field: 'organisme', type: DataType.STRING })
  organisme: string | null

  @Column({ field: 'presence_conseiller', type: DataType.BOOLEAN })
  presenceConseiller: boolean

  @Column({ field: 'invitation', type: DataType.BOOLEAN })
  invitation: boolean | null

  @Column({ field: 'createur', type: DataType.JSONB })
  createur: {
    id: string
    nom: string
    prenom: string
  }

  @ForeignKey(() => AgenceSqlModel)
  @Column({
    field: 'id_agence',
    type: DataType.STRING
  })
  idAgence: string | null

  @Column({
    field: 'type_partenaire',
    type: DataType.STRING
  })
  typePartenaire: string | null

  @Column({
    field: 'id_partenaire',
    type: DataType.STRING
  })
  idPartenaire: string | null

  @Column({ field: 'nombre_max_participants', type: DataType.INTEGER })
  nombreMaxParticipants: number | null
}

@Table({ timestamps: false, tableName: 'rendez_vous' })
export class RendezVousSqlModel extends RendezVousDto {
  @BelongsToMany(() => JeuneSqlModel, () => RendezVousJeuneAssociationSqlModel)
  jeunes: JeuneSqlModel[]

  @HasMany(() => LogModificationRendezVousSqlModel)
  logs: LogModificationRendezVousSqlModel[]

  static async creer(rendezVousDto: AsSql<RendezVousDto>): Promise<void> {
    await RendezVousSqlModel.create(rendezVousDto)
  }
}
