import { Authentification } from '../../../domain/authentification'
import {
  mapCodeLabelTypeRendezVous,
  mapCodeLabelTypeRendezVousJeune,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  AnimationCollectiveQueryModel,
  RendezVousConseillerDetailQueryModel,
  RendezVousConseillerQueryModel,
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel
} from '../query-models/rendez-vous.query-model'

export function fromSqlToRendezVousJeuneQueryModel(
  rendezVousSql: RendezVousSqlModel,
  typeUtilisateur: Authentification.Type,
  idJeune?: string,
  jeuneSqlModel?: JeuneSqlModel
): RendezVousJeuneQueryModel {
  const jeuneSql =
    jeuneSqlModel ?? rendezVousSql.jeunes.find(jeune => jeune.id === idJeune)

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
      label: getLabelType(rendezVousSql, typeUtilisateur)
    },
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller,
    invitation: Boolean(rendezVousSql.invitation),
    createur: rendezVousSql.createur,
    conseiller: jeuneSqlModel?.conseiller
      ? {
          id: jeuneSqlModel?.conseiller.id,
          nom: jeuneSqlModel?.conseiller.nom,
          prenom: jeuneSqlModel?.conseiller.prenom
        }
      : {
          id: rendezVousSql.jeunes[0].conseiller!.id,
          nom: rendezVousSql.jeunes[0].conseiller!.nom,
          prenom: rendezVousSql.jeunes[0].conseiller!.prenom
        },
    source: rendezVousSql.source,
    futPresent: jeuneSql ? getPresence(jeuneSql) : undefined
  }
}

export function fromSqlToRendezVousDetailJeuneQueryModel(
  rendezVousSql: RendezVousSqlModel,
  jeuneId: string,
  type: Authentification.Type
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
      label: Authentification.estJeune(type)
        ? mapCodeLabelTypeRendezVousJeune[rendezVousSql.type]
        : mapCodeLabelTypeRendezVous[rendezVousSql.type]
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
    nombreMaxParticipants: rendezVousSql.nombreMaxParticipants ?? undefined,
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
    statut: construireStatut(rendezVousSql, maintenant),
    nombreMaxParticipants: rendezVousSql.nombreMaxParticipants ?? undefined
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
    }),
    nombreMaxParticipants: rendezVousSql.nombreMaxParticipants ?? undefined
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
export function getPresence(jeuneSqlModel: JeuneSqlModel): boolean | undefined {
  const rendezVousJeuneAssociation = jeuneSqlModel.get(
    RendezVousJeuneAssociationSqlModel.name
  ) as RendezVousJeuneAssociationSqlModel | undefined
  return rendezVousJeuneAssociation?.present ?? undefined
}

function getLabelType(
  rendezVousSql: RendezVousSqlModel,
  typeUtilisateur: Authentification.Type
): string {
  if (Authentification.estJeune(typeUtilisateur)) {
    return mapCodeLabelTypeRendezVousJeune[rendezVousSql.type]
  } else {
    return mapCodeLabelTypeRendezVous[rendezVousSql.type]
  }
}
