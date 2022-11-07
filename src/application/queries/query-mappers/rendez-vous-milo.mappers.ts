import { mapCodeLabelTypeRendezVous } from '../../../domain/rendez-vous'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  RendezVousConseillerQueryModel,
  RendezVousJeuneQueryModel
} from '../query-models/rendez-vous.query-model'
import { LogModificationRendezVousSqlModel } from '../../../infrastructure/sequelize/models/log-modification-rendez-vous-sql.model'

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
  rendezVousSql: RendezVousSqlModel,
  historiqueSql?: LogModificationRendezVousSqlModel[]
): RendezVousConseillerQueryModel {
  const rendezVousConseiller: RendezVousConseillerQueryModel = {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    date: rendezVousSql.date,
    modality: rendezVousSql.modalite ?? '',
    duration: rendezVousSql.duree,
    title: rendezVousSql.titre ?? '',
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
  if (historiqueSql) {
    rendezVousConseiller.historique = historiqueSql.map(log => {
      return {
        date: log.date.toISOString(),
        auteur: log.auteur
      }
    })
  }
  return rendezVousConseiller
}
