import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { Situation } from '../../../infrastructure/sequelize/models/situations-milo.sql-model'
import { DateService } from '../../../utils/date-service'
import {
  DetailJeuneConseillerQueryModel,
  DetailJeuneQueryModel
} from '../query-models/jeunes.query-model'

export function fromSqlToDetailJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel,
  optionsMilo?: {
    baseUrlDossier: string
    estAArchiver: boolean
  }
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
      id: jeuneSqlModel.idConseiller!,
      email: jeuneSqlModel.conseiller!.email ?? undefined,
      prenom: jeuneSqlModel.conseiller!.prenom,
      nom: jeuneSqlModel.conseiller!.nom,
      depuis: depuis.toISOString()
    },
    situations: jeuneSqlModel.situations?.situations,
    structureMilo: jeuneSqlModel.idStructureMilo
      ? { id: jeuneSqlModel.idStructureMilo }
      : undefined,
    idPartenaire: jeuneSqlModel.idPartenaire ?? undefined,
    urlDossier:
      optionsMilo?.baseUrlDossier && jeuneSqlModel.idPartenaire
        ? `${optionsMilo.baseUrlDossier}/${jeuneSqlModel.idPartenaire}/acces-externe`
        : undefined,
    estAArchiver: optionsMilo?.estAArchiver
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
    dateFinCEJ: sqlJeune.date_fin_cej
      ? DateService.fromJSDateToISOString(sqlJeune.date_fin_cej)
      : undefined,
    isActivated: Boolean(sqlJeune.date_premiere_connexion),
    isReaffectationTemporaire: Boolean(sqlJeune.id_conseiller_initial),
    situationCourante: sqlJeune.situation_courante ?? undefined,
    structureMilo: sqlJeune.id_structure_milo
      ? { id: sqlJeune.id_structure_milo }
      : undefined
  }
  if (sqlJeune.date_derniere_actualisation_token) {
    jeuneQueryModel.lastActivity =
      sqlJeune.date_derniere_actualisation_token.toISOString()
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

export interface JeuneRawSql {
  id: string
  prenom: string
  nom: string
}

export interface DetailJeuneRawSql extends JeuneRawSql {
  email: string
  date_creation: Date
  id_authentification: string
  date_derniere_actualisation_token: Date | null
  id_conseiller_initial: string
  email_conseiller_precedent: string
  nom_conseiller_precedent: string
  date_fin_cej: Date | null
  prenom_conseiller_precedent: string
  situation_courante: Situation
  date_premiere_connexion: Date
  id_structure_milo: string | null
}
