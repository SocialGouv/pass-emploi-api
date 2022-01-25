import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Recherche } from '../../../domain/recherche'
import { GetOffresEmploiQuery } from '../../../application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQuery } from '../../../application/queries/get-offres-immersion.query.handler'
import { JeuneSqlModel } from './jeune.sql-model'

export class RechercheDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id!: string

  @ForeignKey(() => JeuneSqlModel)
  @Column({ field: 'id_jeune' })
  idJeune: string

  @Column({ field: 'type', type: DataType.STRING })
  type!: Recherche.Type

  @Column({ field: 'metier', type: DataType.STRING })
  metier!: string

  @Column({ field: 'localisation', type: DataType.STRING })
  localisation!: string

  @Column({ field: 'criteres', type: DataType.JSONB })
  criteres!: GetOffresEmploiQuery | GetOffresImmersionQuery
}

@Table({ timestamps: false, tableName: 'recherche' })
export class RechercheSqlModel extends RechercheDto {}
