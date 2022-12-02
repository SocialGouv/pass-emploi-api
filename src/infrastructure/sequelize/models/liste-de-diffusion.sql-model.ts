import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from './jeune.sql-model'
import { ListeDeDiffusionJeuneAssociationSqlModel } from './liste-de-diffusion-jeune-association.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'

export class ListeDeDiffusionDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @Column({ field: 'titre', type: DataType.STRING })
  titre: string

  @ForeignKey(() => ConseillerSqlModel)
  @Column({ field: 'id_conseiller' })
  idConseiller: string

  @Column({ field: 'date_de_creation', type: DataType.DATE })
  dateDeCreation: Date
}

@Table({ timestamps: false, tableName: 'liste-de-diffusion' })
export class ListeDeDiffusionSqlModel extends ListeDeDiffusionDto {
  @BelongsToMany(
    () => JeuneSqlModel,
    () => ListeDeDiffusionJeuneAssociationSqlModel
  )
  jeunes: JeuneSqlModel[]
}
