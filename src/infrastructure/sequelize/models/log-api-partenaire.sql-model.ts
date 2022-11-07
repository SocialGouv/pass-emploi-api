import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class LogApiPartenaireDto extends Model {
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
  pathPartenaire: string

  @Column({
    field: 'resultat_partenaire',
    type: DataType.JSONB
  })
  resultatPartenaire: unknown

  @Column({
    field: 'resultat',
    type: DataType.JSONB
  })
  resultat: unknown

  @Column({
    field: 'transaction_id',
    type: DataType.STRING
  })
  transactionId: string
}

@Table({
  timestamps: false,
  tableName: 'log_api_partenaire'
})
export class LogApiPartenaireSqlModel extends LogApiPartenaireDto {}
