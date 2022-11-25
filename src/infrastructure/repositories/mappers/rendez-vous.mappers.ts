import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { toConfigurationApplication } from './jeunes.mappers'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../sequelize/types'
import { JeuneDuRendezVous, RendezVous } from '../../../domain/rendez-vous'
import { DateService } from '../../../utils/date-service'

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
    dateCloture: rendezVous.dateCloture?.toJSDate() ?? null,
    type: rendezVous.type,
    precision: rendezVous.precision ?? null,
    adresse: rendezVous.adresse ?? null,
    organisme: rendezVous.organisme ?? null,
    presenceConseiller: rendezVous.presenceConseiller,
    invitation: rendezVous.invitation ?? null,
    icsSequence: rendezVous.icsSequence ?? null,
    createur: rendezVous.createur,
    idAgence: rendezVous.idAgence ?? null
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
    createur: rendezVousSql.createur,
    dateCloture: DateService.fromJSDateToDateTime(rendezVousSql.dateCloture),
    idAgence: rendezVousSql.idAgence ?? undefined
  }
}

function fromJeuneSqlToJeuneDuRdv(jeune: JeuneSqlModel): JeuneDuRendezVous {
  return {
    id: jeune.id,
    firstName: jeune.prenom,
    lastName: jeune.nom,
    email: jeune.email ?? undefined,
    conseiller: {
      id: jeune.conseiller!.id,
      firstName: jeune.conseiller!.prenom,
      lastName: jeune.conseiller!.nom,
      email: jeune.conseiller!.email ?? undefined
    },
    configuration: toConfigurationApplication(jeune)
  }
}
