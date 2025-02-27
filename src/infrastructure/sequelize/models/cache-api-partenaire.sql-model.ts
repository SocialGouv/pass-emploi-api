import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class CacheApiPartenaireDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.UUID
  })
  id: string

  @Column({
    field: 'id_utilisateur',
    type: DataType.STRING
  })
  idUtilisateur: string

  @Column({
    field: 'type_utilisateur',
    type: DataType.STRING
  })
  typeUtilisateur: string

  @Column({
    field: 'date',
    type: DataType.DATE
  })
  date: Date

  @Column({
    field: 'path_partenaire',
    type: DataType.STRING
  })
  pathPartenaire: string | null

  @Column({
    field: 'resultat_partenaire',
    type: DataType.JSONB
  })
  resultatPartenaire: unknown | null

  @Column({
    field: 'transaction_id',
    type: DataType.STRING
  })
  transactionId: string | null
}

@Table({
  timestamps: false,
  tableName: 'cache_api_partenaire'
})
export class CacheApiPartenaireSqlModel extends CacheApiPartenaireDto {}
