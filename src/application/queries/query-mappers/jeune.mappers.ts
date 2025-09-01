import { DateTime } from 'luxon'
import { Jeune } from '../../../domain/jeune/jeune'
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
    lastActivity: jeuneSqlModel.dateDerniereActualisationToken
      ? DateService.fromJSDateToISOString(
          jeuneSqlModel.dateDerniereActualisationToken
        )
      : jeuneSqlModel.dateDerniereConnexion
      ? DateService.fromJSDateToISOString(jeuneSqlModel.dateDerniereConnexion)
      : undefined,
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
    estAArchiver: optionsMilo?.estAArchiver,
    dateSignatureCGU: jeuneSqlModel.dateSignatureCGU?.toISOString(),
    dispositif: jeuneSqlModel.dispositif,
    peutVoirLeComptageDesHeures:
      jeuneSqlModel.peutVoirLeComptageDesHeures ?? undefined
  }
}

export function toDetailJeuneConseillerQueryModel(
  sqlJeune: DetailJeuneRawSql,
  maintenant: DateTime
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
      : undefined,
    estAArchiver: estAArchiver(sqlJeune, maintenant),
    dispositif: sqlJeune.dispositif
  }
  if (
    sqlJeune.date_derniere_actualisation_token ||
    sqlJeune.date_derniere_connexion
  ) {
    jeuneQueryModel.lastActivity =
      sqlJeune.date_derniere_actualisation_token?.toISOString() ??
      sqlJeune.date_derniere_connexion?.toISOString()
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

function estAArchiver(
  sqlJeune: DetailJeuneRawSql,
  maintenant: DateTime
): boolean {
  if (sqlJeune.est_a_archiver) {
    return true
  }
  const ilYa6mois = maintenant.minus({ months: 6, days: 1 })
  if (sqlJeune.date_fin_cej) {
    const dateFinCEJ = DateTime.fromJSDate(sqlJeune.date_fin_cej)
    if (DateService.isGreater(ilYa6mois, dateFinCEJ)) {
      return true
    }
  }
  if (sqlJeune.date_derniere_actualisation_token) {
    const dateToken = DateTime.fromJSDate(
      sqlJeune.date_derniere_actualisation_token
    )
    if (DateService.isGreater(ilYa6mois, dateToken)) {
      return true
    }
  }
  return false
}

export interface JeuneRawSql {
  id: string
  prenom: string
  nom: string
}

export interface DetailJeuneRawSql extends JeuneRawSql {
  email: string
  dispositif: Jeune.Dispositif
  date_creation: Date
  id_authentification: string
  date_derniere_actualisation_token: Date | null
  id_conseiller_initial: string
  email_conseiller_precedent: string
  nom_conseiller_precedent: string
  date_fin_cej: Date | null
  prenom_conseiller_precedent: string
  situation_courante: Situation
  date_premiere_connexion: Date | null
  date_derniere_connexion: Date | null
  id_structure_milo: string | null
  est_a_archiver: boolean
}
