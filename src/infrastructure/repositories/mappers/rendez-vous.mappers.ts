import { JeuneDuRendezVous, RendezVous } from 'src/domain/rendez-vous'
import {
  RendezVousDto,
  RendezVousSqlModel
} from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

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

export function toRendezVous(rendezVousSql: RendezVousSqlModel): RendezVous {
  return {
    id: rendezVousSql.id,
    titre: rendezVousSql.titre,
    sousTitre: rendezVousSql.sousTitre,
    modalite: rendezVousSql.modalite ?? undefined,
    duree: rendezVousSql.duree,
    date: rendezVousSql.date,
    commentaire: rendezVousSql.commentaire ?? undefined,
    jeunes: rendezVousSql.jeunes.map(fromJeuneSqlToJeuneDuRdv),
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

function fromJeuneSqlToJeuneDuRdv(jeune: JeuneSqlModel): JeuneDuRendezVous {
  return {
    id: jeune.id,
    firstName: jeune.prenom,
    lastName: jeune.nom,
    email: jeune.email ?? undefined,
    pushNotificationToken: jeune.pushNotificationToken ?? undefined,
    conseiller: {
      id: jeune.conseiller!.id,
      firstName: jeune.conseiller!.prenom,
      lastName: jeune.conseiller!.nom,
      structure: jeune.conseiller!.structure,
      email: jeune.conseiller!.email ?? undefined,
      notificationsSonores: jeune.conseiller!.notificationsSonores
    }
  }
}
