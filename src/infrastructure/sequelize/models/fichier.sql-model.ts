import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { AsSql } from '../types'

export class FichierDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.UUID
  })
  id: string

  @Column({
    field: 'ids_jeunes',
    type: DataType.ARRAY(DataType.STRING)
  })
  idsJeunes: string[]

  @Column({
    field: 'mime_type',
    type: DataType.STRING
  })
  mimeType: string

  @Column({
    field: 'nom',
    type: DataType.STRING
  })
  nom: string

  @Column({
    field: 'date_creation',
    type: DataType.DATE
  })
  dateCreation: Date
}

@Table({
  timestamps: false,
  tableName: 'fichier'
})
export class FichierSqlModel extends FichierDto {
  static async creer(fichierDto: AsSql<FichierDto>): Promise<void> {
    await FichierSqlModel.create(fichierDto)
  }
}
