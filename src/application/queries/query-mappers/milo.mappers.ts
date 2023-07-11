import {
  OffreTypeCode,
  SessionConseillerDetailDto,
  SessionJeuneDetailDto
} from 'src/infrastructure/clients/dto/milo.dto'
import {
  DetailSessionConseillerMiloQueryModel,
  DetailSessionJeuneMiloQueryModel,
  SessionConseillerMiloQueryModel,
  SessionJeuneMiloQueryModel,
  SessionTypeQueryModel
} from '../query-models/sessions.milo.query.model'
import { DateTime } from 'luxon'

function buildSessionTypeQueryModel(
  type: OffreTypeCode
): SessionTypeQueryModel {
  switch (type) {
    case OffreTypeCode.WORKSHOP:
      return { code: type, label: 'Atelier i-milo' }
    case OffreTypeCode.COLLECTIVE_INFORMATION:
      return { code: type, label: 'info coll i-milo' }
  }
}

export function mapSessionJeuneDtoToQueryModel(
  sessionDto: SessionJeuneDetailDto,
  timezone: string
): SessionJeuneMiloQueryModel {
  return {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    dateHeureDebut: DateTime.fromFormat(
      sessionDto.session.dateHeureDebut,
      'yyyy-MM-dd HH:mm:ss',
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: DateTime.fromFormat(
      sessionDto.session.dateHeureFin,
      'yyyy-MM-dd HH:mm:ss',
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    type: buildSessionTypeQueryModel(sessionDto.offre.type)
  }
}

export function mapSessionConseillerDtoToQueryModel(
  sessionDto: SessionConseillerDetailDto,
  estVisible: boolean,
  timezone: string
): SessionConseillerMiloQueryModel {
  return {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    estVisible: estVisible,
    dateHeureDebut: DateTime.fromFormat(
      sessionDto.session.dateHeureDebut,
      'yyyy-MM-dd HH:mm:ss',
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: DateTime.fromFormat(
      sessionDto.session.dateHeureFin,
      'yyyy-MM-dd HH:mm:ss',
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    type: buildSessionTypeQueryModel(sessionDto.offre.type)
  }
}

export function mapDetailSessionConseillerDtoToQueryModel(
  sessionDto: SessionConseillerDetailDto,
  estVisible: boolean,
  timezone: string
): DetailSessionConseillerMiloQueryModel {
  return {
    session: {
      id: sessionDto.session.id.toString(),
      nom: sessionDto.session.nom,
      dateHeureDebut: DateTime.fromFormat(
        sessionDto.session.dateHeureDebut,
        'yyyy-MM-dd HH:mm:ss',
        { zone: timezone }
      )
        .toUTC()
        .toISO(),
      dateHeureFin: DateTime.fromFormat(
        sessionDto.session.dateHeureFin,
        'yyyy-MM-dd HH:mm:ss',
        { zone: timezone }
      )
        .toUTC()
        .toISO(),
      dateMaxInscription: sessionDto.session.dateMaxInscription ?? undefined,
      animateur: sessionDto.session.animateur,
      lieu: sessionDto.session.lieu,
      estVisible: estVisible,
      nbPlacesDisponibles: sessionDto.session.nbPlacesDisponibles ?? undefined,
      commentaire: sessionDto.session.commentaire ?? undefined
    },
    offre: {
      id: sessionDto.offre.id.toString(),
      nom: sessionDto.offre.nom,
      theme: sessionDto.offre.theme,
      type: buildSessionTypeQueryModel(sessionDto.offre.type),
      description: sessionDto.offre.description ?? undefined,
      nomPartenaire: sessionDto.offre.nomPartenaire ?? undefined
    }
  }
}

export function mapDetailSessionJeuneDtoToQueryModel(
  sessionDto: SessionJeuneDetailDto,
  timezone: string
): DetailSessionJeuneMiloQueryModel {
  return {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    theme: sessionDto.offre.theme,
    type: buildSessionTypeQueryModel(sessionDto.offre.type),
    dateHeureDebut: DateTime.fromFormat(
      sessionDto.session.dateHeureDebut,
      'yyyy-MM-dd HH:mm:ss',
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    dateHeureFin: DateTime.fromFormat(
      sessionDto.session.dateHeureFin,
      'yyyy-MM-dd HH:mm:ss',
      { zone: timezone }
    )
      .toUTC()
      .toISO(),
    lieu: sessionDto.session.lieu,
    animateur: sessionDto.session.animateur,
    nomPartenaire: sessionDto.offre.nomPartenaire ?? undefined,
    description: sessionDto.offre.description ?? undefined,
    commentaire: sessionDto.session.commentaire ?? undefined,
    dateMaxInscription: sessionDto.session.dateMaxInscription ?? undefined,
    nbPlacesDisponibles: sessionDto.session.nbPlacesDisponibles ?? undefined
  }
}
