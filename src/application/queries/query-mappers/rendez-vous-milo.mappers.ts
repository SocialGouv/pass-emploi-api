import { mapCodeLabelTypeRendezVous } from '../../../domain/rendez-vous'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  RendezVousConseillerQueryModel,
  RendezVousJeuneQueryModel
} from '../query-models/rendez-vous.query-models'

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
    title: '',
    jeune: {
      id: rendezVousSql.jeunes[0].id,
      nom: rendezVousSql.jeunes[0].nom,
      prenom: rendezVousSql.jeunes[0].prenom
    },
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
    }
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
    // TODO: ENLEVER QUAND LE WEB EST A JOUR
    jeune: {
      id: rendezVousSql.jeunes[0].id,
      nom: rendezVousSql.jeunes[0].nom,
      prenom: rendezVousSql.jeunes[0].prenom
    },
    jeunes: rendezVousSql.jeunes.map(jeune => ({
      id: jeune.id,
      prenom: jeune.prenom,
      nom: jeune.nom
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
    createur: rendezVousSql.createur
  }
}
