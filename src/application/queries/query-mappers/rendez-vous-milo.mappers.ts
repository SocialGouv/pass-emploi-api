import {
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import {
  RendezVousJeuneDetailQueryModel,
  AnimationCollectiveQueryModel,
  RendezVousConseillerDetailQueryModel,
  RendezVousConseillerQueryModel,
  RendezVousJeuneQueryModel
} from '../query-models/rendez-vous.query-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'

export function fromSqlToRendezVousJeuneQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousJeuneQueryModel {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    date: rendezVousSql.date,
    isLocaleDate: false,
    modality: rendezVousSql.modalite ?? '',
    duration: rendezVousSql.duree,
    title: rendezVousSql.titre ?? '',
    type: {
      code: rendezVousSql.type,
      label: mapCodeLabelTypeRendezVous[rendezVousSql.type]
    },
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller,
    invitation: Boolean(rendezVousSql.invitation),
    createur: rendezVousSql.createur,
    conseiller: {
      id: rendezVousSql.jeunes[0].conseiller!.id,
      nom: rendezVousSql.jeunes[0].conseiller!.nom,
      prenom: rendezVousSql.jeunes[0].conseiller!.prenom
    },
    source: rendezVousSql.source
  }
}

export function fromSqlToRendezVousDetailJeuneQueryModel(
  rendezVousSql: RendezVousSqlModel,
  jeuneId: string
): RendezVousJeuneDetailQueryModel {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    date: rendezVousSql.date,
    isLocaleDate: false,
    modality: rendezVousSql.modalite ?? '',
    duration: rendezVousSql.duree,
    title: rendezVousSql.titre ?? '',
    estInscrit: Boolean(
      rendezVousSql.jeunes?.map(jeune => jeune.id).find(id => id === jeuneId)
    ),
    type: {
      code: rendezVousSql.type,
      label: mapCodeLabelTypeRendezVous[rendezVousSql.type]
    },
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller,
    invitation: Boolean(rendezVousSql.invitation),
    createur: rendezVousSql.createur,
    source: rendezVousSql.source
  }
}

export function fromSqlToRendezVousConseillerQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousConseillerQueryModel {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    date: rendezVousSql.date,
    modality: rendezVousSql.modalite ?? '',
    duration: rendezVousSql.duree,
    title: rendezVousSql.titre ?? '',
    jeunes: rendezVousSql.jeunes.map(jeune => ({
      id: jeune.id,
      prenom: jeune.prenom,
      nom: jeune.nom,
      futPresent: getPresence(jeune)
    })),
    type: {
      code: rendezVousSql.type,
      label: mapCodeLabelTypeRendezVous[rendezVousSql.type]
    },
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller,
    invitation: Boolean(rendezVousSql.invitation),
    createur: rendezVousSql.createur,
    source: rendezVousSql.source
  }
}

export function fromSqlToAnimationCollectiveQueryModel(
  rendezVousSql: RendezVousSqlModel,
  maintenant: Date
): AnimationCollectiveQueryModel {
  return {
    ...fromSqlToRendezVousConseillerQueryModel(rendezVousSql),
    statut: construireStatut(rendezVousSql, maintenant)
  }
}

export function fromSqlToRendezVousConseillerDetailQueryModel(
  rendezVousSql: RendezVousSqlModel,
  maintenant: Date
): RendezVousConseillerDetailQueryModel {
  const rendezVousConseiller: RendezVousConseillerDetailQueryModel = {
    ...fromSqlToRendezVousConseillerQueryModel(rendezVousSql),
    historique: rendezVousSql.logs?.map(log => {
      return {
        date: log.date.toISOString(),
        auteur: log.auteur
      }
    })
  }

  if (RendezVous.estUnTypeAnimationCollective(rendezVousSql.type)) {
    rendezVousConseiller.statut = construireStatut(rendezVousSql, maintenant)
  }

  return rendezVousConseiller
}

export function construireStatut(
  rendezVousSql: RendezVousSqlModel,
  maintenant: Date
): RendezVous.AnimationCollective.Statut {
  if (rendezVousSql.dateCloture === null) {
    if (rendezVousSql.date <= maintenant) {
      return RendezVous.AnimationCollective.Statut.A_CLOTURER
    }
    return RendezVous.AnimationCollective.Statut.A_VENIR
  } else {
    return RendezVous.AnimationCollective.Statut.CLOTUREE
  }
}

// La requête SQL qui récupère les jeunes d'un rendez-vous passe par une table de jointure
// Dans le résultat de la requête, on peut récupérer les informations supplémentaires de l'association
// Pour palier au problème de typage, on utilise la technique ci-dessous.
function getPresence(jeuneSqlModel: JeuneSqlModel): boolean | undefined {
  const rendezVousJeuneAssociation = jeuneSqlModel.get(
    RendezVousJeuneAssociationSqlModel.name
  ) as RendezVousJeuneAssociationSqlModel | undefined
  return rendezVousJeuneAssociation?.present ?? undefined
}
