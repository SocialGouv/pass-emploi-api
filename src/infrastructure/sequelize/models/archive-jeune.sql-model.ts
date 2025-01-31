import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { ArchiveJeune } from '../../../domain/archive-jeune'
import { AsSql } from '../types'

export class ArchiveJeuneDto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id: number

  @Column({
    field: 'id_jeune',
    type: DataType.STRING
  })
  idJeune: string

  @Column({
    field: 'motif',
    type: DataType.STRING
  })
  motif: string

  @Column({
    field: 'commentaire',
    type: DataType.STRING
  })
  commentaire: string | null

  @Column({
    field: 'prenom',
    type: DataType.STRING
  })
  prenom: string

  @Column({
    field: 'nom',
    type: DataType.STRING
  })
  nom: string

  @Column({
    field: 'structure',
    type: DataType.STRING
  })
  structure: string | null

  @Column({
    field: 'dispositif',
    type: DataType.STRING
  })
  dispositif: string | null

  @Column({
    field: 'id_structure_milo',
    type: DataType.STRING
  })
  idStructureMilo: string | null

  @Column({
    field: 'id_partenaire',
    type: DataType.STRING
  })
  idPartenaire: string | null

  @Column({
    field: 'date_creation',
    type: DataType.DATE
  })
  dateCreation: Date | null

  @Column({
    field: 'date_premiere_connexion',
    type: DataType.DATE
  })
  datePremiereConnexion: Date | null

  @Column({
    field: 'date_fin_accompagnement',
    type: DataType.DATE
  })
  dateFinAccompagnement: Date | null

  @Column({
    field: 'email',
    type: DataType.STRING
  })
  email: string | null

  @Column({
    field: 'date_archivage',
    type: DataType.DATE
  })
  dateArchivage: Date

  @Column({ field: 'donnees', type: DataType.JSONB })
  donnees: ArchiveJeune
}

@Table({
  timestamps: false,
  tableName: 'archive_jeune'
})
export class ArchiveJeuneSqlModel extends ArchiveJeuneDto {
  static async creer(
    archiveDto: AsSql<Omit<ArchiveJeuneDto, 'id'>>
  ): Promise<void> {
    await ArchiveJeuneSqlModel.create(archiveDto)
  }
}
