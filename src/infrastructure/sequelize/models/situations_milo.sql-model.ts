import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { CategorieSituationMilo, EtatSituationMilo } from 'src/domain/milo'
import { JeuneSqlModel } from './jeune.sql-model'

interface Situation {
  etat: EtatSituationMilo
  categorie: CategorieSituationMilo
  dateFin?: string
}

@Table({ timestamps: false, tableName: 'situations_milo' })
export class SituationsMiloSqlModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id', type: DataType.INTEGER })
  id: number

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune', type: DataType.STRING })
  idJeune: string

  @Column({ field: 'situation_courante', type: DataType.JSONB })
  situationCourante: Situation | null

  @Column({ field: 'situations', type: DataType.ARRAY(DataType.JSONB) })
  situations: Situation[]
}
