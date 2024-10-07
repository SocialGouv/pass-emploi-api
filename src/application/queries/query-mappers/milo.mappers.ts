import { Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { SessionMilo } from 'src/domain/milo/session.milo'
import {
  MILO_INSCRIT,
  MILO_PRESENT,
  MILO_REFUS_JEUNE,
  MILO_REFUS_TIERS,
  OffreTypeCode,
  SessionConseillerDetailDto,
  SessionJeuneDetailDto,
  SessionParDossierJeuneDto
} from 'src/infrastructure/clients/dto/milo.dto'
import {
  AgendaConseillerMiloSessionListItemQueryModel,
  DetailSessionConseillerMiloQueryModel,
  DetailSessionConseillerQueryModel,
  DetailSessionJeuneMiloQueryModel,
  InscritSessionMiloQueryModel,
  SessionConseillerMiloQueryModel,
  SessionJeuneMiloQueryModel,
  SessionTypeQueryModel
} from '../query-models/sessions.milo.query.model'

export const MILO_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss'

function buildSessionTypeQueryModel(
  type: OffreTypeCode
): SessionTypeQueryModel {
  switch (type) {
    case OffreTypeCode.WORKSHOP:
      return { code: type, label: 'Atelier' }
    case OffreTypeCode.COLLECTIVE_INFORMATION:
      return { code: type, label: 'Information collective' }
  }
}

export function mapSessionJeuneDtoToQueryModel(
  sessionDto: SessionParDossierJeuneDto,
  idDossier: string,
  timezone: string
): SessionJeuneMiloQueryModel {
  const queryModel: SessionJeuneMiloQueryModel = {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    dateHeureDebut: DateTime.fromFormat(
      sessionDto.session.dateHeureDebut,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: DateTime.fromFormat(
      sessionDto.session.dateHeureFin,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    type: buildSessionTypeQueryModel(sessionDto.offre.type)
  }
  if (sessionDto.sessionInstance) {
    queryModel.inscription = dtoToStatutInscription(
      sessionDto.sessionInstance.statut,
      sessionDto.session.id,
      idDossier
    )
  }

  return queryModel
}

export function mapSessionConseillerDtoToQueryModel(
  { offre, session }: SessionConseillerDetailDto,
  estVisible: boolean,
  timezone: string,
  maintenant: DateTime,
  dateCloture?: DateTime
): SessionConseillerMiloQueryModel {
  const dateHeureFin = DateTime.fromFormat(
    session.dateHeureFin,
    MILO_DATE_FORMAT,
    { zone: timezone }
  ).toUTC()

  const nombreParticipants = (session.instances ?? [])
    .map(({ idDossier, statut }) =>
      dtoToStatutInscription(statut, session.id, idDossier.toString())
    )
    .filter(
      statut =>
        statut === SessionMilo.Inscription.Statut.INSCRIT ||
        statut === SessionMilo.Inscription.Statut.PRESENT
    ).length

  const queryModel: SessionConseillerMiloQueryModel = {
    id: session.id.toString(),
    nomSession: session.nom,
    nomOffre: offre.nom,
    estVisible: estVisible,
    dateHeureDebut: DateTime.fromFormat(
      session.dateHeureDebut,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: dateHeureFin.toISO(),
    type: buildSessionTypeQueryModel(offre.type),
    statut: SessionMilo.calculerStatut(maintenant, dateHeureFin, dateCloture),
    nombreParticipants
  }

  if (session.nbPlacesDisponibles !== null)
    queryModel.nombreMaxParticipants =
      session.nbPlacesDisponibles + nombreParticipants

  return queryModel
}

export function mapSessionConseillerDtoToAgendaQueryModel(
  sessionDto: SessionConseillerDetailDto,
  timezone: string,
  inscrits: InscritSessionMiloQueryModel[]
): AgendaConseillerMiloSessionListItemQueryModel {
  return {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    dateHeureDebut: DateTime.fromFormat(
      sessionDto.session.dateHeureDebut,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: DateTime.fromFormat(
      sessionDto.session.dateHeureFin,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    type: buildSessionTypeQueryModel(sessionDto.offre.type),
    beneficiaires: inscrits,
    nbPlacesRestantes: sessionDto.session.nbPlacesDisponibles ?? undefined,
    nbInscrits: inscrits.length
  }
}

export function mapDetailSessionJeuneDtoToQueryModel(
  sessionDto: SessionJeuneDetailDto,
  idDossier: string,
  timezone: string,
  inscription?: { statut: string }
): DetailSessionJeuneMiloQueryModel {
  const queryModel: DetailSessionJeuneMiloQueryModel = {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    theme: sessionDto.offre.theme,
    type: buildSessionTypeQueryModel(sessionDto.offre.type),
    dateHeureDebut: DateTime.fromFormat(
      sessionDto.session.dateHeureDebut,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: DateTime.fromFormat(
      sessionDto.session.dateHeureFin,
      MILO_DATE_FORMAT,
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    lieu: sessionDto.session.lieu,
    animateur: sessionDto.session.animateur,
    nomPartenaire: sessionDto.offre.nomPartenaire ?? undefined,
    description: sessionDto.offre.description ?? undefined,
    commentaire: sessionDto.session.commentaire ?? undefined,
    dateMaxInscription: sessionDto.session.dateMaxInscription
      ? DateTime.fromISO(sessionDto.session.dateMaxInscription, {
          zone: timezone
        })
          .endOf('day')
          .toUTC()
          .toISO()
      : undefined,
    nbPlacesDisponibles: sessionDto.session.nbPlacesDisponibles ?? undefined
  }
  if (inscription)
    queryModel.inscription = {
      statut: dtoToStatutInscription(
        inscription.statut,
        sessionDto.session.id,
        idDossier
      )
    }

  return queryModel
}

export function mapSessionToDetailSessionConseillerQueryModel(
  session: SessionMilo,
  maintenant: DateTime
): DetailSessionConseillerMiloQueryModel {
  const sessionQueryModel: DetailSessionConseillerQueryModel = {
    id: session.id,
    nom: session.nom,
    dateHeureDebut: session.debut.toUTC().toISO(),
    dateHeureFin: session.fin.toUTC().toISO(),
    animateur: session.animateur,
    lieu: session.lieu,
    estVisible: session.estVisible,
    statut: SessionMilo.calculerStatut(
      maintenant,
      session.fin,
      session.dateCloture
    )
  }

  if (session.dateMaxInscription) {
    sessionQueryModel.dateMaxInscription = session.dateMaxInscription
      .toUTC()
      .toISO()
  }
  if (session.nbPlacesDisponibles !== undefined)
    sessionQueryModel.nbPlacesDisponibles = session.nbPlacesDisponibles
  if (session.commentaire) sessionQueryModel.commentaire = session.commentaire

  return {
    session: sessionQueryModel,
    offre: session.offre,
    inscriptions: session.inscriptions.map(inscription => ({
      idJeune: inscription.idJeune,
      nom: inscription.nom,
      prenom: inscription.prenom,
      statut: inscription.statut
    }))
  }
}

export function dtoToStatutInscription(
  statut: string,
  idSession: number,
  idDossier: string
): SessionMilo.Inscription.Statut {
  switch (statut) {
    case MILO_INSCRIT:
      return SessionMilo.Inscription.Statut.INSCRIT
    case MILO_PRESENT:
      return SessionMilo.Inscription.Statut.PRESENT
    case MILO_REFUS_TIERS:
      return SessionMilo.Inscription.Statut.REFUS_TIERS
    case MILO_REFUS_JEUNE:
      return SessionMilo.Inscription.Statut.REFUS_JEUNE
    default:
      const logger = new Logger('SessionMilo.dtoToStatutInscription')
      logger.error(
        `Une inscription a un statut inconnu : session ${idSession}, dossier ${idDossier}`
      )
      return SessionMilo.Inscription.Statut.INSCRIT
  }
}
