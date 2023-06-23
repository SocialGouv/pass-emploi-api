import {
  OffreTypeCode,
  SessionConseillerDetailDto
} from 'src/infrastructure/clients/dto/milo.dto'
import {
  DetailSessionConseillerMiloQueryModel,
  SessionConseillerMiloQueryModel,
  SessionTypeQueryModel
} from '../query-models/sessions.milo.query.model'
import { DateTime } from 'luxon'

function buildSessionTypeQueryModel(
  sessionDto: SessionConseillerDetailDto
): SessionTypeQueryModel {
  switch (sessionDto.offre.type) {
    case OffreTypeCode.WORKSHOP:
      return { code: sessionDto.offre.type, label: 'Atelier i-milo' }
    case OffreTypeCode.COLLECTIVE_INFORMATION:
      return { code: sessionDto.offre.type, label: 'info coll i-milo' }
  }
}

export function mapSessionDtoToQueryModel(
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
    type: buildSessionTypeQueryModel(sessionDto)
  }
}

export function mapDetailSessionDtoToQueryModel(
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
      type: buildSessionTypeQueryModel(sessionDto),
      description: sessionDto.offre.description ?? undefined,
      nomPartenaire: sessionDto.offre.nomPartenaire ?? undefined
    }
  }
}
