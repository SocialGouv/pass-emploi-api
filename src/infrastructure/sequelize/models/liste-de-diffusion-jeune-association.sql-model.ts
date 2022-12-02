import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { JeuneSqlModel } from './jeune.sql-model'
import { ListeDeDiffusionSqlModel } from './liste-de-diffusion.sql-model'

@Table({
  timestamps: false,
  tableName: 'liste-de-diffusion-beneficiaire-association'
})
export class ListeDeDiffusionJeuneAssociationSqlModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id: number

  @ForeignKey(() => ListeDeDiffusionSqlModel)
  @Column({ field: 'id_liste', type: DataType.STRING })
  idListe: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_beneficiaire', type: DataType.STRING })
  idBeneficiaire: string

  @Column({ field: 'date_ajout', type: DataType.DATE })
  dateAjout: Date
}
