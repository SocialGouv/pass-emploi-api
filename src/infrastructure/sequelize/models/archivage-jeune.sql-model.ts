import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { ArchivageJeune } from 'src/domain/archivage-jeune'

export class ArchivageJeuneDto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id: number

  @Column({
    field: 'email',
    type: DataType.STRING
  })
  email: string

  @Column({
    field: 'date_archivage',
    type: DataType.DATE
  })
  dateArchivage: Date

  @Column({ field: 'donnees', type: DataType.JSONB })
  donnees: ArchivageJeune.DonneesArchivees
}

@Table({
  timestamps: false,
  tableName: 'archivage_jeune'
})
export class ArchivageJeuneSqlModel extends ArchivageJeuneDto {}
