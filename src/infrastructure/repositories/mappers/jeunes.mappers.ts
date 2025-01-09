import { DateTime, Duration } from 'luxon'
import { JeuneHomeQueryModel } from '../../../application/queries/query-models/home-jeune.query-model'
import { Action } from '../../../domain/action/action'
import { Jeune } from '../../../domain/jeune/jeune'
import { mapCodeLabelTypeRendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { ActionSqlModel } from '../../sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../sequelize/models/rendez-vous.sql-model'
import { buildEtat } from './actions.mappers'

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
    dispositif: jeuneSqlModel.dispositif
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

export function fromSqlToJeuneHomeQueryModel(
  jeuneSqlModel: JeuneSqlModel,
  rdvJeuneSqlModel: RendezVousSqlModel[]
): JeuneHomeQueryModel {
  return {
    conseiller: {
      id: jeuneSqlModel.conseiller!.id,
      firstName: jeuneSqlModel.conseiller!.prenom,
      lastName: jeuneSqlModel.conseiller!.nom,
      email: jeuneSqlModel.conseiller!.email ?? undefined
    },
    doneActionsCount: jeuneSqlModel.actions.filter(
      actionsSql => actionsSql.statut === Action.Statut.TERMINEE
    ).length,
    actions: jeuneSqlModel.actions.map(actionSql => ({
      id: actionSql.id,
      creationDate: DateTime.fromJSDate(actionSql.dateCreation).toFormat(
        'EEE, d MMM yyyy HH:mm:ss z'
      ),
      content: actionSql.contenu,
      status: actionSql.statut,
      comment: actionSql.description,
      isDone: actionSql.statut === Action.Statut.TERMINEE,
      lastUpdate: DateTime.fromJSDate(
        actionSql.dateDerniereActualisation
      ).toFormat('EEE, d MMM yyyy HH:mm:ss z'),
      creatorType: actionSql.typeCreateur,
      creator: toCreator(actionSql, jeuneSqlModel),
      dateEcheance: actionSql.dateEcheance.toISOString(),
      dateFinReelle: actionSql.dateFinReelle?.toISOString(),
      etat: buildEtat(actionSql)
    })),
    rendezvous:
      rdvJeuneSqlModel?.map(rendezVousSql => ({
        id: rendezVousSql.id,
        comment: rendezVousSql.commentaire ?? '',
        date: DateTime.fromJSDate(rendezVousSql.date)
          .setZone('Europe/Paris')
          .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
        dateUtc: DateTime.fromJSDate(rendezVousSql.date).toISO(),
        duration: Duration.fromObject({
          minutes: rendezVousSql.duree
        }).toFormat('h:mm:ss'),
        modality: rendezVousSql.modalite ?? '',
        title: rendezVousSql.titre,
        subtitle: rendezVousSql.sousTitre,
        type: {
          code: rendezVousSql.type,
          label: mapCodeLabelTypeRendezVous[rendezVousSql.type]
        },
        precision: rendezVousSql.precision ?? undefined,
        adresse: rendezVousSql.adresse ?? undefined,
        organisme: rendezVousSql.organisme ?? undefined,
        presenceConseiller: rendezVousSql.presenceConseiller,
        source: rendezVousSql.source
      })) ?? []
  }
}

function toCreator(
  actionSql: ActionSqlModel,
  jeuneSqlModel: JeuneSqlModel
): string {
  if (actionSql.typeCreateur === Action.TypeCreateur.JEUNE) {
    return `${jeuneSqlModel.prenom} ${jeuneSqlModel.nom}`
  }
  return `${jeuneSqlModel.conseiller!.prenom} ${jeuneSqlModel.conseiller!.nom}`
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
