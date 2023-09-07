import { DateTime } from 'luxon'
import {
  AgendaConseillerMiloSessionListItemQueryModel,
  DetailSessionConseillerMiloQueryModel,
  DetailSessionJeuneMiloQueryModel,
  SessionConseillerMiloQueryModel,
  SessionJeuneMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { OffreTypeCode } from 'src/infrastructure/clients/dto/milo.dto'
import { SessionMilo } from '../../src/domain/milo/session.milo'

export const uneSessionConseillerMiloQueryModel: SessionConseillerMiloQueryModel =
  {
    id: '1',
    nomSession: 'Une-session',
    nomOffre: 'Une-offre',
    estVisible: false,
    dateHeureDebut: '2020-04-06T13:20:00.000Z',
    dateHeureFin: '2020-04-08T13:20:00.000Z',
    type: {
      code: OffreTypeCode.WORKSHOP,
      label: 'Atelier'
    },
    statut: SessionMilo.Statut.A_CLOTURER
  }

export const uneSessionJeuneMiloQueryModel = (
  args: Partial<SessionJeuneMiloQueryModel> = {}
): SessionJeuneMiloQueryModel => {
  const defaults: SessionJeuneMiloQueryModel = {
    id: '1',
    nomSession: 'Une-session',
    nomOffre: 'Une-offre',
    dateHeureDebut: '2020-04-06T13:20:00.000Z',
    dateHeureFin: '2020-04-08T13:20:00.000Z',
    type: {
      code: OffreTypeCode.WORKSHOP,
      label: 'Atelier'
    }
  }
  return { ...defaults, ...args }
}

export const unDetailSessionConseillerMiloQueryModel: DetailSessionConseillerMiloQueryModel =
  {
    session: {
      id: '1',
      nom: 'Une-session',
      dateHeureDebut: '2020-04-06T13:20:00.000Z',
      dateHeureFin: '2020-04-08T13:20:00.000Z',
      dateMaxInscription: '2020-04-07T10:20:00.000Z',
      animateur: 'Un-animateur',
      lieu: 'Un-lieu',
      estVisible: false,
      nbPlacesDisponibles: 10,
      commentaire: 'Un-commentaire',
      statut: SessionMilo.Statut.A_CLOTURER
    },
    offre: {
      id: '1',
      nom: 'Une-offre',
      theme: 'Un-theme',
      type: { code: OffreTypeCode.WORKSHOP, label: 'Atelier' },
      description: 'Une-Desc',
      nomPartenaire: 'Un-partenaire'
    },
    inscriptions: []
  }

export const unDetailSessionJeuneMiloQueryModel: DetailSessionJeuneMiloQueryModel =
  {
    id: '1',
    nomSession: 'Une-session',
    nomOffre: 'Une-offre',
    theme: 'Un-theme',
    type: { code: OffreTypeCode.WORKSHOP, label: 'Atelier' },
    dateHeureDebut: '2020-04-06T13:20:00.000Z',
    dateHeureFin: '2020-04-08T13:20:00.000Z',
    lieu: 'Un-lieu',
    animateur: 'Un-animateur',
    nomPartenaire: 'Un-partenaire',
    description: 'Une-Desc',
    commentaire: 'Un-commentaire',
    dateMaxInscription: '2020-04-07T10:20:00.000Z',
    nbPlacesDisponibles: 10
  }

export const unAgendaConseillerMiloSessionListItemQueryModel: AgendaConseillerMiloSessionListItemQueryModel =
  {
    id: '1',
    nomSession: 'Une-session',
    nomOffre: 'Une-offre',
    dateHeureDebut: '2020-04-06T13:20:00.000Z',
    dateHeureFin: '2020-04-08T13:20:00.000Z',
    type: {
      code: 'WORKSHOP',
      label: 'Atelier'
    },
    beneficiaires: [
      {
        idJeune: 'id-hermione',
        prenom: 'John',
        nom: 'Doe',
        statut: SessionMilo.Inscription.Statut.INSCRIT
      }
    ]
  }

export const uneSessionMilo = (
  args: Partial<SessionMilo> = {}
): SessionMilo => {
  const defaults: SessionMilo = {
    id: '1',
    idStructureMilo: 'structure-milo',
    animateur: 'Un-animateur',
    commentaire: 'Un-commentaire',
    estVisible: false,
    dateMaxInscription: DateTime.fromISO('2020-04-07T10:20:00.000Z'),
    debut: DateTime.fromISO('2020-04-06T13:20:00.000Z', {
      zone: 'America/Cayenne'
    }),
    fin: DateTime.fromISO('2020-04-08T13:20:00.000Z', {
      zone: 'America/Cayenne'
    }),
    dateCloture: undefined,
    inscriptions: [
      {
        idJeune: 'id-hermione',
        idInscription: 'id-inscription-hermione',
        nom: 'Granger',
        prenom: 'Hermione',
        statut: SessionMilo.Inscription.Statut.INSCRIT
      },
      {
        idJeune: 'id-ron',
        idInscription: 'id-inscription-ron',
        nom: 'Weasley',
        prenom: 'Ronald',
        statut: SessionMilo.Inscription.Statut.REFUS_TIERS
      },
      {
        idJeune: 'id-harry',
        idInscription: 'id-inscription-harry',
        nom: 'Potter',
        prenom: 'Harry',
        statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
      }
    ],
    lieu: 'Un-lieu',
    nbPlacesDisponibles: 10,
    nom: 'Une-session',
    offre: {
      description: 'Une-Desc',
      id: '1',
      nom: 'Une-offre',
      nomPartenaire: 'Un-partenaire',
      theme: 'Un-theme',
      type: {
        code: 'WORKSHOP',
        label: 'Atelier'
      }
    }
  }

  return { ...defaults, ...args }
}
