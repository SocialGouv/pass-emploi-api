import {
  OffreTypeCode,
  SessionConseillerDetailDto
} from '../../../infrastructure/clients/dto/milo.dto'
import {
  SessionConseillerMiloQueryModel,
  SessionTypeQueryModel
} from '../query-models/sessions.milo.query.model'

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
  sessionDto: SessionConseillerDetailDto
): SessionConseillerMiloQueryModel {
  return {
    id: sessionDto.session.id.toString(),
    nomSession: sessionDto.session.nom,
    nomOffre: sessionDto.offre.nom,
    dateHeureDebut: sessionDto.session.dateHeureDebut,
    dateHeureFin: sessionDto.session.dateHeureFin,
    type: buildSessionTypeQueryModel(sessionDto)
  }
}
