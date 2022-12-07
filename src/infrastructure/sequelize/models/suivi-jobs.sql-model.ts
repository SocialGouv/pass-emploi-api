import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Planificateur } from '../../../domain/planificateur'

export class SuiviJobsDto extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    field: 'id',
    type: DataType.INTEGER
  })
  id?: number

  @Column({
    field: 'job_type',
    type: DataType.STRING
  })
  jobType: Planificateur.JobType

  @Column({
    field: 'date_execution',
    type: DataType.DATE
  })
  dateExecution: Date

  @Column({
    field: 'succes',
    type: DataType.BOOLEAN
  })
  succes: boolean

  @Column({
    field: 'resultat',
    type: DataType.JSONB
  })
  resultat: unknown

  @Column({
    field: 'nb_erreurs',
    type: DataType.INTEGER
  })
  nbErreurs: number

  @Column({
    field: 'temps_execution',
    type: DataType.INTEGER
  })
  tempsExecution: number
}

@Table({
  timestamps: false,
  tableName: 'suivi_jobs'
})
export class SuiviJobsSqlModel extends SuiviJobsDto {}
