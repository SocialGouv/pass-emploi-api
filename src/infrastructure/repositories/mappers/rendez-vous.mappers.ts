import { RendezVous } from 'src/domain/rendez-vous'
import {
  RendezVousDtoOld,
  RendezVousSqlModelOld
} from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export function toRendezVousDto(
  rendezVous: RendezVous
): AsSql<RendezVousDtoOld> {
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
    presenceConseiller: rendezVous.presenceConseiller,
    invitation: rendezVous.invitation ?? null,
    icsSequence: rendezVous.icsSequence ?? null,
    createur: rendezVous.createur
  }
}

export function toRendezVous(rendezVousSql: RendezVousSqlModelOld): RendezVous {
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
      email: rendezVousSql.jeune.email ?? undefined,
      pushNotificationToken:
        rendezVousSql.jeune.pushNotificationToken ?? undefined,
      conseiller: {
        id: rendezVousSql.jeune.conseiller!.id,
        firstName: rendezVousSql.jeune.conseiller!.prenom,
        lastName: rendezVousSql.jeune.conseiller!.nom,
        structure: rendezVousSql.jeune.conseiller!.structure,
        email: rendezVousSql.jeune.conseiller!.email ?? undefined
      }
    },
    type: rendezVousSql.type,
    precision: rendezVousSql.precision ?? undefined,
    adresse: rendezVousSql.adresse ?? undefined,
    organisme: rendezVousSql.organisme ?? undefined,
    presenceConseiller: rendezVousSql.presenceConseiller,
    invitation: rendezVousSql.invitation ?? undefined,
    icsSequence: rendezVousSql.icsSequence ?? undefined,
    createur: rendezVousSql.createur
  }
}
