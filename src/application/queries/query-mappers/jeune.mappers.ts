import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import {
  DetailJeuneConseillerQueryModel,
  DetailJeuneQueryModel
} from '../query-models/jeunes.query-model'
import { Situation } from '../../../infrastructure/sequelize/models/situations-milo.sql-model'
import { DateService } from 'src/utils/date-service'

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
    dateFinCEJ: jeuneSqlModel.dateFinCEJ
      ? DateService.fromJSDateToISOString(jeuneSqlModel.dateFinCEJ)
      : undefined,
    datePremiereConnexion: jeuneSqlModel.datePremiereConnexion?.toISOString(),
    isActivated: Boolean(jeuneSqlModel.datePremiereConnexion),
    isReaffectationTemporaire: Boolean(jeuneSqlModel.idConseillerInitial),
    conseiller: {
      email: jeuneSqlModel.conseiller!.email ?? undefined,
      prenom: jeuneSqlModel.conseiller!.prenom,
      nom: jeuneSqlModel.conseiller!.nom,
      depuis: depuis.toISOString()
    },
    situations: jeuneSqlModel.situations?.situations,
    idPartenaire: jeuneSqlModel.idPartenaire ?? undefined,
    urlDossier:
      baseUrlDossier && jeuneSqlModel.idPartenaire
        ? `${baseUrlDossier}/${jeuneSqlModel.idPartenaire}/acces-externe`
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
    isActivated: Boolean(sqlJeune.date_premiere_connexion),
    isReaffectationTemporaire: Boolean(sqlJeune.id_conseiller_initial),
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
  id_conseiller_initial: string
  email_conseiller_precedent: string
  nom_conseiller_precedent: string
  prenom_conseiller_precedent: string
  situation_courante: Situation
  date_premiere_connexion: Date
}
