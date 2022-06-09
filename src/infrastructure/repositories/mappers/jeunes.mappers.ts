import { DateTime, Duration } from 'luxon'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-model'
import {
  JeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-model'
import { Action } from 'src/domain/action'
import { Jeune } from 'src/domain/jeune'
import { mapCodeLabelTypeRendezVous } from 'src/domain/rendez-vous'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../sequelize/types'
import { ResumeActionsJeuneDto } from '../jeune-sql.repository.db'

export function fromSqlToJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): JeuneQueryModel {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom
  }
}

export function fromSqlToJeune(jeuneSqlModel: JeuneSqlModel): Jeune {
  const jeune: Jeune = {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    creationDate: DateTime.fromJSDate(jeuneSqlModel.dateCreation).toUTC(),
    isActivated: Boolean(jeuneSqlModel.idAuthentification),
    pushNotificationToken: jeuneSqlModel.pushNotificationToken ?? undefined,
    tokenLastUpdate: getTokenLastUpdate(jeuneSqlModel),
    structure: jeuneSqlModel.structure,
    email: jeuneSqlModel.email ?? undefined,
    idDossier: jeuneSqlModel.idDossier ?? undefined
  }
  if (jeuneSqlModel.conseiller) {
    jeune.conseiller = {
      id: jeuneSqlModel.conseiller.id,
      firstName: jeuneSqlModel.conseiller.prenom,
      lastName: jeuneSqlModel.conseiller.nom,
      structure: jeuneSqlModel.conseiller.structure,
      email: jeuneSqlModel.conseiller.email || undefined,
      notificationsSonores: jeuneSqlModel.conseiller.notificationsSonores
    }
  }
  return jeune
}

export function toSqlJeune(
  jeune: Jeune
): Omit<
  AsSql<JeuneDto>,
  'idAuthentification' | 'datePremiereConnexion' | 'dateDerniereConnexion'
> {
  return {
    id: jeune.id,
    nom: jeune.lastName,
    prenom: jeune.firstName,
    idConseiller: jeune.conseiller?.id,
    dateCreation: jeune.creationDate.toJSDate(),
    pushNotificationToken: jeune.pushNotificationToken ?? null,
    dateDerniereActualisationToken: jeune.tokenLastUpdate?.toJSDate() ?? null,
    email: jeune.email ?? null,
    structure: jeune.structure,
    idDossier: jeune.idDossier ?? null
  }
}

function getTokenLastUpdate(
  jeuneSqlModel: JeuneSqlModel
): DateTime | undefined {
  return jeuneSqlModel.dateDerniereActualisationToken
    ? DateTime.fromJSDate(jeuneSqlModel.dateDerniereActualisationToken).toUTC()
    : undefined
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
      comment: actionSql.commentaire,
      isDone: actionSql.statut === Action.Statut.TERMINEE,
      lastUpdate: DateTime.fromJSDate(
        actionSql.dateDerniereActualisation
      ).toFormat('EEE, d MMM yyyy HH:mm:ss z'),
      creatorType: actionSql.typeCreateur,
      creator: toCreator(actionSql, jeuneSqlModel)
    })),
    rendezvous:
      rdvJeuneSqlModel?.map(rendezVousSql => ({
        id: rendezVousSql.id,
        comment: rendezVousSql.commentaire ?? '',
        date: DateTime.fromJSDate(rendezVousSql.date)
          .setZone('Europe/Paris')
          .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
        dateUtc: DateTime.fromJSDate(rendezVousSql.date).toUTC().toISO(),
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
        presenceConseiller: rendezVousSql.presenceConseiller
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

export function toResumeActionsDuJeuneQueryModel(
  resumeActionsJeuneDto: ResumeActionsJeuneDto
): ResumeActionsDuJeuneQueryModel {
  return {
    jeuneId: resumeActionsJeuneDto.id_jeune,
    jeuneFirstName: resumeActionsJeuneDto.prenom_jeune,
    jeuneLastName: resumeActionsJeuneDto.nom_jeune,
    todoActionsCount: parseInt(resumeActionsJeuneDto.todo_actions_count),
    doneActionsCount: parseInt(resumeActionsJeuneDto.done_actions_count),
    inProgressActionsCount: parseInt(
      resumeActionsJeuneDto.in_progress_actions_count
    )
  }
}
