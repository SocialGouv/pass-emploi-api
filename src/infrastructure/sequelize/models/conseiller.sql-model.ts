import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Authentification } from '../../../domain/authentification'
import { AsSql } from '../types'
import { JeuneSqlModel } from './jeune.sql-model'

export class ConseillerDto extends Model {
  @PrimaryKey
  @Column({ field: 'id', type: DataType.STRING })
  id: string

  @Column({ field: 'nom', type: DataType.STRING })
  nom: string

  @Column({ field: 'prenom', type: DataType.STRING })
  prenom: string

  @Column({ field: 'email', type: DataType.STRING })
  email: string | null

  @Column({ field: 'structure', type: DataType.STRING })
  structure: Authentification.Structure

  @Column({ field: 'id_authentification', type: DataType.STRING })
  idAuthentification: string
}

@Table({ timestamps: false, tableName: 'conseiller' })
export class ConseillerSqlModel extends ConseillerDto {
  @HasMany(() => JeuneSqlModel)
  jeunes!: JeuneSqlModel[]

  static async creer(conseillerDto: AsSql<ConseillerDto>): Promise<void> {
    await ConseillerSqlModel.create(conseillerDto)
  }
}
