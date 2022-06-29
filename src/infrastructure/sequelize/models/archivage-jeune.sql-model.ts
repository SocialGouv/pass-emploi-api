import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { ArchiveJeune } from 'src/domain/archive-jeune'

export class ArchivageJeuneDto extends Model {
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
export class ArchivageJeuneSqlModel extends ArchivageJeuneDto {}
