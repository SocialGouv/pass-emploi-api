import { DateTime, Duration } from 'luxon'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-models'
import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-models'
import { Action } from 'src/domain/action'
import { Jeune } from 'src/domain/jeune'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../sequelize/types'
import { ResumeActionsJeuneDto } from '../jeune-sql.repository'

export function fromSqlToDetailJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): DetailJeuneQueryModel {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    email: jeuneSqlModel.email ?? undefined,
    creationDate: jeuneSqlModel.dateCreation.toISOString(),
    isActivated: !!jeuneSqlModel.idAuthentification
  }
}

export function fromSqlToJeune(jeuneSqlModel: JeuneSqlModel): Jeune {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    creationDate: DateTime.fromJSDate(jeuneSqlModel.dateCreation).toUTC(),
    pushNotificationToken: jeuneSqlModel.pushNotificationToken ?? undefined,
    tokenLastUpdate: getTokenLastUpdate(jeuneSqlModel),
    conseiller: {
      id: jeuneSqlModel.conseiller.id,
      firstName: jeuneSqlModel.conseiller.prenom,
      lastName: jeuneSqlModel.conseiller.nom,
      structure: jeuneSqlModel.conseiller.structure,
      email: jeuneSqlModel.conseiller.email || undefined
    },
    structure: jeuneSqlModel.structure,
    email: jeuneSqlModel.email ?? undefined
  }
}

export function toSqlJeune(
  jeune: Jeune
): Omit<AsSql<JeuneDto>, 'idAuthentification'> {
  return {
    id: jeune.id,
    nom: jeune.lastName,
    prenom: jeune.firstName,
    idConseiller: jeune.conseiller.id,
    dateCreation: jeune.creationDate.toJSDate(),
    pushNotificationToken: jeune.pushNotificationToken ?? null,
    dateDerniereActualisationToken: jeune.tokenLastUpdate?.toJSDate() ?? null,
    email: jeune.email ?? null,
    structure: jeune.structure
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
  jeuneSqlModel: JeuneSqlModel
): JeuneHomeQueryModel {
  function toCreator(
    actionSql: ActionSqlModel,
    jeuneSqlModel: JeuneSqlModel
  ): string {
    if (actionSql.typeCreateur === Action.TypeCreateur.JEUNE) {
      return `${jeuneSqlModel.prenom} ${jeuneSqlModel.nom}`
    }
    return `${jeuneSqlModel.conseiller.prenom} ${jeuneSqlModel.conseiller.nom}`
  }

  return {
    conseiller: {
      id: jeuneSqlModel.conseiller.id,
      firstName: jeuneSqlModel.conseiller.prenom,
      lastName: jeuneSqlModel.conseiller.nom
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
    rendezvous: jeuneSqlModel.rendezVous.map(rendezVousSql => ({
      id: rendezVousSql.id,
      comment: rendezVousSql.commentaire ?? '',
      date: DateTime.fromJSDate(rendezVousSql.date).toFormat(
        'EEE, d MMM yyyy HH:mm:ss z'
      ),
      duration: Duration.fromObject({
        minutes: rendezVousSql.duree
      }).toFormat('h:mm:ss'),
      modality: rendezVousSql.modalite ?? '',
      title: rendezVousSql.titre,
      subtitle: rendezVousSql.sousTitre
    }))
  }
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

export function toDetailJeunQueryModel(
  sqlJeune: DetailJeuneRawSql
): DetailJeuneQueryModel {
  const jeuneQueryModel: DetailJeuneQueryModel = {
    id: sqlJeune.id,
    firstName: sqlJeune.prenom,
    lastName: sqlJeune.nom,
    email: sqlJeune.email ?? undefined,
    creationDate: sqlJeune.date_creation.toISOString(),
    isActivated: !!sqlJeune.id_authentification
  }
  if (sqlJeune.date_evenement) {
    jeuneQueryModel.lastActivity = sqlJeune.date_evenement.toISOString()
  }
  if (sqlJeune.email_conseiller_precedent) {
    jeuneQueryModel.conseillerPrecedent = {
      email: sqlJeune.email_conseiller_precedent,
      firstName: sqlJeune.prenom_conseiller_precedent,
      lastName: sqlJeune.nom_conseiller_precedent
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
  prenom_conseiller_precedent: string
  nom_conseiller_precedent: string
}
