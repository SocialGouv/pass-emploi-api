import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { ArchivageJeune } from 'src/domain/archivage-jeune'
import { ActionSqlModel } from './action.sql-model'
import { FavoriOffreEmploiSqlModel } from './favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from './favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from './favori-offre-immersion.sql-model'
import { JeuneDto } from './jeune.sql-model'
import { RechercheSqlModel } from './recherche.sql-model'
import { RendezVousJeuneAssociationSqlModel } from './rendez-vous-jeune-association.model'
import { RendezVousSqlModel } from './rendez-vous.sql-model'

export class ArchiavageJeuneDto extends Model {
  @PrimaryKey
  @Column({
    field: 'id',
    type: DataType.UUID
  })
  id: string

  @Column({
    field: 'email',
    type: DataType.STRING
  })
  email: string

  @Column({
    field: 'date_archivage',
    type: DataType.DATE
  })
  dateArchivage: Date

  @Column({ field: 'donnees', type: DataType.JSONB })
  donnees: ArchivageJeune.DonneesArchivees
}

@Table({
  timestamps: false,
  tableName: 'archivage_jeune'
})
export class ArchiavageJeuneSqlModel extends ArchiavageJeuneDto {}

@Table({
  timestamps: false,
  tableName: 'jeune'
})
export class JeuneArchivageSqlModel extends JeuneDto {
  @BelongsToMany(
    () => RendezVousSqlModel,
    () => RendezVousJeuneAssociationSqlModel
  )
  rdv!: RendezVousSqlModel[]

  @HasMany(() => ActionSqlModel)
  actions!: ActionSqlModel[]

  @HasMany(() => FavoriOffreEmploiSqlModel)
  favorisOffreEmploi!: FavoriOffreEmploiSqlModel[]

  @HasMany(() => FavoriOffreImmersionSqlModel)
  favorisOffreImmersion!: FavoriOffreImmersionSqlModel[]

  @HasMany(() => FavoriOffreEngagementSqlModel)
  favorisOffreEngagement!: FavoriOffreEngagementSqlModel[]

  @HasMany(() => RechercheSqlModel)
  recherches!: RechercheSqlModel[]
}
