import { getPresence } from '../../../application/queries/query-mappers/rendez-vous-milo.mappers'
import {
  JeuneDuRendezVous,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { DateService } from '../../../utils/date-service'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../sequelize/types'
import {
  fromSqlToPreferencesJeune,
  toConfigurationApplication
} from './jeunes.mappers'

export function toRendezVousDto(rendezVous: RendezVous): AsSql<RendezVousDto> {
  return {
    id: rendezVous.id,
    source: rendezVous.source,
    titre: rendezVous.titre,
    sousTitre: rendezVous.sousTitre,
    modalite: rendezVous.modalite ?? null,
    duree: rendezVous.duree,
    date: rendezVous.date,
    commentaire: rendezVous.commentaire ?? null,
    dateCloture: rendezVous.dateCloture?.toJSDate() ?? null,
    type: rendezVous.type,
    precision: rendezVous.precision ?? null,
    adresse: rendezVous.adresse ?? null,
    organisme: rendezVous.organisme ?? null,
    presenceConseiller: rendezVous.presenceConseiller,
    invitation: rendezVous.invitation ?? null,
    icsSequence: rendezVous.icsSequence ?? null,
    createur: rendezVous.createur,
    idAgence: rendezVous.idAgence ?? null,
    typePartenaire: rendezVous.informationsPartenaire?.type ?? null,
    idPartenaire: rendezVous.informationsPartenaire?.id ?? null,
    nombreMaxParticipants: rendezVous.nombreMaxParticipants ?? null
  }
}

export function toRendezVous(rendezVousSql: RendezVousSqlModel): RendezVous {
  return {
    id: rendezVousSql.id,
    source: fromSourceStringToSourceRendezVous(rendezVousSql.source),
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
    idAgence: rendezVousSql.idAgence ?? undefined,
    informationsPartenaire: buildInformationsPartenaire(rendezVousSql),
    nombreMaxParticipants: rendezVousSql.nombreMaxParticipants ?? undefined
  }
}

function buildInformationsPartenaire(
  rendezVousSql: RendezVousSqlModel
): RendezVous.InformationsPartenaire | undefined {
  if (!rendezVousSql.typePartenaire || !rendezVousSql.idPartenaire) {
    return undefined
  }
  return {
    type: rendezVousSql.typePartenaire,
    id: rendezVousSql.idPartenaire
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
      email: jeune.conseiller!.email ?? undefined,
      idAgence: jeune.conseiller!.idAgence ?? undefined
    },
    configuration: toConfigurationApplication(jeune),
    preferences: fromSqlToPreferencesJeune(jeune),
    present: getPresence(jeune)
  }
}

function fromSourceStringToSourceRendezVous(
  sourceString: string
): RendezVous.Source {
  switch (sourceString) {
    case 'PASS_EMPLOI':
      return RendezVous.Source.PASS_EMPLOI
    case 'MILO':
      return RendezVous.Source.MILO
    default:
      throw new Error('Type non traité')
  }
}
