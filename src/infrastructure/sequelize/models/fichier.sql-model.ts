import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Authentification } from 'src/domain/authentification'
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

  @Column({
    field: 'id_createur',
    type: DataType.STRING
  })
  idCreateur: string

  @Column({
    field: 'type_createur',
    type: DataType.STRING
  })
  typeCreateur: Authentification.Type
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
