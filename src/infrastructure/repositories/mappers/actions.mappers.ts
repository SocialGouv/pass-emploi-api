import { DateTime } from 'luxon'
import {
  ActionQueryModel,
  QualificationActionQueryModel
} from '../../../application/queries/query-models/actions.query-model'
import { ActionSqlModel } from '../../sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { JeuneQueryModel } from '../../../application/queries/query-models/jeunes.query-model'
import { Action } from '../../../domain/action/action'
import { DateService } from '../../../utils/date-service'
import { ActionAQualifierQueryModel } from '../../../application/queries/query-models/conseillers.query-model'

export function fromSqlToActionQueryModelWithJeune(
  actionSqlModel: ActionSqlModel
): ActionQueryModel {
  return {
    ...fromSqlToActionQueryModel(actionSqlModel),
    jeune: fromSqlToJeuneQueryModel(actionSqlModel.jeune)
  }
}

export function fromSqlToActionQueryModel(
  actionSqlModel: ActionSqlModel
): ActionQueryModel {
  return {
    id: actionSqlModel.id,
    comment: actionSqlModel.description || '',
    content: actionSqlModel.contenu,
    creationDate: DateTime.fromJSDate(actionSqlModel.dateCreation).toFormat(
      'EEE, d MMM yyyy HH:mm:ss z'
    ),
    creator: `${actionSqlModel.createur.prenom} ${actionSqlModel.createur.nom}`,
    creatorType: actionSqlModel.typeCreateur,
    lastUpdate: DateTime.fromJSDate(
      actionSqlModel.dateDerniereActualisation
    ).toFormat('EEE, d MMM yyyy HH:mm:ss z'),
    status: actionSqlModel.statut,
    dateEcheance: DateService.fromJSDateToISOString(
      actionSqlModel.dateEcheance
    ),
    dateFinReelle: actionSqlModel.dateFinReelle
      ? DateService.fromJSDateToISOString(actionSqlModel.dateFinReelle)
      : undefined,
    etat: buildEtat(actionSqlModel),
    qualification: buildQualificationQueryModel(actionSqlModel)
  }
}

export function fromActionJeuneSqlToActionAQualifierQueryModel(
  actionJeuneSqlModel: Pick<
    ActionSqlModel,
    'id' | 'contenu' | 'jeune' | 'dateFinReelle'
  >
): ActionAQualifierQueryModel {
  return {
    id: actionJeuneSqlModel.id,
    titre: actionJeuneSqlModel.contenu,
    jeune: {
      id: actionJeuneSqlModel.jeune.id,
      nom: actionJeuneSqlModel.jeune.nom,
      prenom: actionJeuneSqlModel.jeune.prenom
    },
    dateFinReelle: actionJeuneSqlModel.dateFinReelle!.toDateString()
  }
}

function fromSqlToJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): JeuneQueryModel {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom
  }
}

export function buildEtat(
  actionSqlModel: ActionSqlModel
): Action.Qualification.Etat {
  if (actionSqlModel.codeQualification) {
    return Action.Qualification.Etat.QUALIFIEE
  }
  if (actionSqlModel.statut === Action.Statut.TERMINEE) {
    return Action.Qualification.Etat.A_QUALIFIER
  }
  return Action.Qualification.Etat.NON_QUALIFIABLE
}

export function buildQualification(
  actionSqlModel: ActionSqlModel
): Action.Qualification | undefined {
  if (actionSqlModel.codeQualification) {
    return {
      heures: actionSqlModel.heuresQualifiees!,
      code: actionSqlModel.codeQualification,
      commentaire: actionSqlModel.commentaireQualification ?? ''
    }
  } else {
    return undefined
  }
}

export function buildQualificationQueryModel(
  actionSqlModel: ActionSqlModel
): QualificationActionQueryModel | undefined {
  if (actionSqlModel.codeQualification) {
    const type =
      Action.Qualification.mapCodeTypeQualification[
        actionSqlModel.codeQualification
      ]
    return {
      heures: type.heures,
      code: actionSqlModel.codeQualification,
      libelle: type.label,
      commentaireQualification: actionSqlModel.commentaireQualification ?? ''
    }
  } else {
    return undefined
  }
}
