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
import { MiloJeune } from '../../../domain/partenaire/milo/milo.jeune'

export interface Situation {
  etat: MiloJeune.EtatSituation
  categorie: MiloJeune.CategorieSituation
  dateFin?: string
}

export class SituationsMiloDto extends Model {
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

@Table({ timestamps: false, tableName: 'situations_milo' })
export class SituationsMiloSqlModel extends SituationsMiloDto {}
