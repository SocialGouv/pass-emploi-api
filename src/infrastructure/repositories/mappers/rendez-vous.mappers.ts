import { DateTime } from 'luxon'
import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import { mapCodeLabelTypeRendezVous, RendezVous } from 'src/domain/rendez-vous'
import {
  RendezVousDto,
  RendezVousSqlModel
} from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export function toRendezVousDto(rendezVous: RendezVous): AsSql<RendezVousDto> {
  return {
    id: rendezVous.id,
    titre: rendezVous.titre,
    sousTitre: rendezVous.sousTitre,
    modalite: rendezVous.modalite ?? null,
    duree: rendezVous.duree,
    date: rendezVous.date,
    commentaire: rendezVous.commentaire ?? null,
    dateSuppression: null,
    idJeune: rendezVous.jeune.id,
    type: rendezVous.type,
    precision: rendezVous.precision ?? null,
    adresse: rendezVous.adresse ?? null,
    organisme: rendezVous.organisme ?? null,
    presenceConseiller: rendezVous.presenceConseiller
  }
}

export function toRendezVous(rendezVousSql: RendezVousSqlModel): RendezVous {
  return {
    id: rendezVousSql.id,
    titre: rendezVousSql.titre,
    sousTitre: rendezVousSql.sousTitre,
    modalite: rendezVousSql.modalite ?? undefined,
    duree: rendezVousSql.duree,
    date: rendezVousSql.date,
    commentaire: rendezVousSql.commentaire ?? undefined,
    jeune: {
      id: rendezVousSql.jeune.id,
      firstName: rendezVousSql.jeune.prenom,
      lastName: rendezVousSql.jeune.nom,
      creationDate: DateTime.fromJSDate(rendezVousSql.jeune.dateCreation),
      pushNotificationToken:
        rendezVousSql.jeune.pushNotificationToken ?? undefined,
      conseiller: {
        id: rendezVousSql.jeune.conseiller.id,
        firstName: rendezVousSql.jeune.conseiller.prenom,
        lastName: rendezVousSql.jeune.conseiller.nom,
        structure: rendezVousSql.jeune.conseiller.structure
      },
      structure: rendezVousSql.jeune.structure
    },
    type: rendezVousSql.type,
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller
  }
}

export function fromSqlToRendezVousConseillerQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousQueryModel {
  return {
    ...fromSqlToRendezVousQueryModel(rendezVousSql),
    title: `${rendezVousSql.jeune.prenom} ${rendezVousSql.jeune.nom}`
  }
}

export function fromSqlToRendezVousJeuneQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousQueryModel {
  return {
    ...fromSqlToRendezVousQueryModel(rendezVousSql),
    title: `${rendezVousSql.jeune.conseiller.prenom} ${rendezVousSql.jeune.conseiller.nom}`,
    conseiller: {
      id: rendezVousSql.jeune.conseiller.id,
      prenom: rendezVousSql.jeune.conseiller.prenom,
      nom: rendezVousSql.jeune.conseiller.nom
    }
  }
}

function fromSqlToRendezVousQueryModel(
  rendezVousSql: RendezVousSqlModel
): Omit<RendezVousQueryModel, 'title'> {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    date: rendezVousSql.date,
    modality: rendezVousSql.modalite ?? '',
    duration: rendezVousSql.duree,
    jeune: {
      id: rendezVousSql.jeune.id,
      prenom: rendezVousSql.jeune.prenom,
      nom: rendezVousSql.jeune.nom
    },
    type: {
      code: rendezVousSql.type,
      label: mapCodeLabelTypeRendezVous[rendezVousSql.type]
    },
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller
  }
}
