import { Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { SessionMilo } from 'src/domain/milo/session.milo'
import {
  OffreTypeCode,
  SessionConseillerDetailDto,
  SessionJeuneDetailDto,
  SessionJeuneListeDto
} from 'src/infrastructure/clients/dto/milo.dto'
import {
  DetailSessionConseillerMiloQueryModel,
  DetailSessionConseillerQueryModel,
  DetailSessionJeuneMiloQueryModel,
  SessionConseillerMiloQueryModel,
  SessionJeuneMiloQueryModel,
  SessionTypeQueryModel
} from '../query-models/sessions.milo.query.model'

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
  sessionDto: SessionJeuneListeDto,
  idDossier: string,
  timezone: string
): SessionJeuneMiloQueryModel {
  const queryModel: SessionJeuneMiloQueryModel = {
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

export function mapSessionToDetailSessionConseillerQueryModel(
  session: SessionMilo
): DetailSessionConseillerMiloQueryModel {
  const sessionQueryModel: DetailSessionConseillerQueryModel = {
    id: session.id,
    nom: session.nom,
    dateHeureDebut: session.debut.toUTC().toISO(),
    dateHeureFin: session.fin.toUTC().toISO(),
    animateur: session.animateur,
    lieu: session.lieu,
    estVisible: session.estVisible
  }

  if (session.dateMaxInscription)
    sessionQueryModel.dateMaxInscription = session.dateMaxInscription
      .toUTC()
      .toISO()
  if (session.nbPlacesDisponibles)
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

function dtoToStatutInscription(
  statut: string,
  idSession: number,
  idDossier: string
): SessionMilo.Inscription.Statut {
  switch (statut) {
    case 'ONGOING':
      return SessionMilo.Inscription.Statut.INSCRIT
    case 'REFUSAL':
      return SessionMilo.Inscription.Statut.REFUS_TIERS
    case 'REFUSAL_YOUNG':
      return SessionMilo.Inscription.Statut.REFUS_JEUNE
    default:
      const logger = new Logger('SessionMilo.dtoToStatutInscription')
      logger.error(
        `Une inscription a un statut inconnu : session ${idSession}, dossier ${idDossier}`
      )
      return SessionMilo.Inscription.Statut.INSCRIT
  }
}
