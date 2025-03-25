import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'
import {
  ActionQueryModel,
  BeneficiaireActionQueryModel,
  QualificationActionQueryModel
} from '../../../application/queries/query-models/actions.query-model'
import { Action } from '../../../domain/action/action'
import { Jeune } from '../../../domain/jeune/jeune'
import { ActionSqlModel } from '../../sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

export function fromSqlToActionQueryModelWithJeune(
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
    etat: buildEtat(actionSqlModel, {
      qualifiable: actionSqlModel.jeune.dispositif === Jeune.Dispositif.CEJ
    }),
    qualification: buildQualificationQueryModel(actionSqlModel),
    jeune: fromSqlToBeneficiarieActionQueryModel(actionSqlModel.jeune)
  }
}

function fromSqlToBeneficiarieActionQueryModel(
  jeuneSqlModel: JeuneSqlModel
): BeneficiaireActionQueryModel {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    idConseiller: jeuneSqlModel.idConseiller!,
    dispositif: jeuneSqlModel.dispositif
  }
}

function buildEtat(
  actionSqlModel: ActionSqlModel,
  { qualifiable }: { qualifiable: boolean }
): Action.Qualification.Etat {
  if (
    actionSqlModel.codeQualification &&
    actionSqlModel.heuresQualifiees !== null
  ) {
    return Action.Qualification.Etat.QUALIFIEE
  }
  if (qualifiable && actionSqlModel.statut === Action.Statut.TERMINEE) {
    return Action.Qualification.Etat.A_QUALIFIER
  }
  return Action.Qualification.Etat.NON_QUALIFIABLE
}

export function buildQualification(
  actionSqlModel: ActionSqlModel
): Action.Qualification | undefined {
  if (actionSqlModel.codeQualification) {
    return {
      code: actionSqlModel.codeQualification,
      heures: actionSqlModel.heuresQualifiees ?? undefined,
      commentaire: actionSqlModel.commentaireQualification ?? undefined
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
      heures: actionSqlModel.heuresQualifiees ?? undefined,
      code: actionSqlModel.codeQualification,
      libelle: type.label,
      commentaireQualification: actionSqlModel.commentaireQualification ?? ''
    }
  } else {
    return undefined
  }
}
