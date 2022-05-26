import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { Situation } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import {
  DetailJeuneConseillerQueryModel,
  DetailJeuneQueryModel
} from '../query-models/jeunes.query-models'

export function fromSqlToDetailJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel,
  baseUrlDossier?: string
): DetailJeuneQueryModel {
  const depuis =
    jeuneSqlModel.transferts.length > 0
      ? jeuneSqlModel.transferts[0].dateTransfert
      : jeuneSqlModel.dateCreation
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    email: jeuneSqlModel.email ?? undefined,
    creationDate: jeuneSqlModel.dateCreation.toISOString(),
    isActivated: Boolean(jeuneSqlModel.idAuthentification),
    conseiller: {
      email: jeuneSqlModel.conseiller!.email ?? undefined,
      prenom: jeuneSqlModel.conseiller!.prenom,
      nom: jeuneSqlModel.conseiller!.nom,
      depuis: depuis.toISOString()
    },
    situations: jeuneSqlModel.situations?.situations,
    urlDossier:
      baseUrlDossier && jeuneSqlModel.idDossier
        ? `${baseUrlDossier}/${jeuneSqlModel.idDossier}/acces-externe`
        : undefined
  }
}

export function toDetailJeuneConseillerQueryModel(
  sqlJeune: DetailJeuneRawSql
): DetailJeuneConseillerQueryModel {
  const jeuneQueryModel: DetailJeuneConseillerQueryModel = {
    id: sqlJeune.id,
    firstName: sqlJeune.prenom,
    lastName: sqlJeune.nom,
    email: sqlJeune.email ?? undefined,
    creationDate: sqlJeune.date_creation.toISOString(),
    isActivated: Boolean(sqlJeune.id_authentification),
    situationCourante: sqlJeune.situation_courante ?? undefined
  }
  if (sqlJeune.date_evenement) {
    jeuneQueryModel.lastActivity = sqlJeune.date_evenement.toISOString()
  }

  if (
    sqlJeune.nom_conseiller_precedent ||
    sqlJeune.prenom_conseiller_precedent ||
    sqlJeune.email_conseiller_precedent
  ) {
    jeuneQueryModel.conseillerPrecedent = {
      prenom: sqlJeune.prenom_conseiller_precedent,
      nom: sqlJeune.nom_conseiller_precedent,
      email: sqlJeune.email_conseiller_precedent ?? undefined
    }
  }
  return jeuneQueryModel
}

export interface DetailJeuneRawSql {
  id: string
  prenom: string
  nom: string
  email: string
  date_creation: Date
  id_authentification: string
  date_evenement: Date
  email_conseiller_precedent: string
  nom_conseiller_precedent: string
  prenom_conseiller_precedent: string
  situation_courante: Situation
}
