import { DateTime } from 'luxon'
import { Jeune } from '../../../domain/jeune/jeune'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

export function fromSqlToJeune(jeuneSqlModel: JeuneSqlModel): Jeune {
  const jeune: Jeune = {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    creationDate: DateTime.fromJSDate(jeuneSqlModel.dateCreation),
    datePremiereConnexion: jeuneSqlModel.datePremiereConnexion
      ? DateTime.fromJSDate(jeuneSqlModel.datePremiereConnexion)
      : undefined,
    isActivated: Boolean(jeuneSqlModel.datePremiereConnexion),
    structure: jeuneSqlModel.structure,
    email: jeuneSqlModel.email ?? undefined,
    idPartenaire: jeuneSqlModel.idPartenaire ?? undefined,
    configuration: toConfigurationApplication(jeuneSqlModel),
    preferences: fromSqlToPreferencesJeune(jeuneSqlModel),
    dispositif: jeuneSqlModel.dispositif,
    peutVoirLeComptageDesHeures:
      jeuneSqlModel.peutVoirLeComptageDesHeures ?? undefined,
    dateSignatureCGU: jeuneSqlModel.dateSignatureCGU
      ? DateTime.fromJSDate(jeuneSqlModel.dateSignatureCGU)
      : undefined
  }
  if (jeuneSqlModel.conseiller) {
    jeune.conseiller = {
      id: jeuneSqlModel.conseiller.id,
      firstName: jeuneSqlModel.conseiller.prenom,
      lastName: jeuneSqlModel.conseiller.nom,
      email: jeuneSqlModel.conseiller.email || undefined,
      idAgence: jeuneSqlModel.conseiller.idAgence || undefined
    }
  }
  if (jeuneSqlModel.idConseillerInitial) {
    jeune.conseillerInitial = {
      id: jeuneSqlModel.idConseillerInitial
    }
  }
  return jeune
}

export function fromSqlToPreferencesJeune(
  jeuneSqlModel: JeuneSqlModel
): Jeune.Preferences {
  return {
    partageFavoris: jeuneSqlModel.partageFavoris,
    alertesOffres: jeuneSqlModel.notificationsAlertesOffres,
    messages: jeuneSqlModel.notificationsMessages,
    creationActionConseiller:
      jeuneSqlModel.notificationsCreationActionConseiller,
    rendezVousSessions: jeuneSqlModel.notificationsRendezVousSessions,
    rappelActions: jeuneSqlModel.notificationsRappelActions
  }
}

export function toConfigurationApplication(
  jeuneSqlModel: JeuneSqlModel
): Jeune.ConfigurationApplication {
  return {
    idJeune: jeuneSqlModel.id,
    appVersion: jeuneSqlModel.appVersion ?? undefined,
    installationId: jeuneSqlModel.installationId ?? undefined,
    instanceId: jeuneSqlModel.instanceId ?? undefined,
    dateDerniereActualisationToken:
      jeuneSqlModel.dateDerniereActualisationToken ?? undefined,
    pushNotificationToken: jeuneSqlModel.pushNotificationToken ?? undefined,
    fuseauHoraire: jeuneSqlModel.timezone ?? undefined
  }
}
