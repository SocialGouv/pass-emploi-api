import {
  DetailSessionConseillerMiloQueryModel,
  SessionConseillerMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { OffreTypeCode } from 'src/infrastructure/clients/dto/milo.dto'

export const uneSessionConseillerMiloQueryModel =
  (): SessionConseillerMiloQueryModel => {
    return {
      id: '1',
      nomSession: 'Une-session',
      nomOffre: 'Une-offre',
      estVisible: false,
      dateHeureDebut: '2020-04-06T13:20:00.000Z',
      dateHeureFin: '2020-04-08T13:20:00.000Z',
      type: {
        code: OffreTypeCode.WORKSHOP,
        label: 'Atelier i-milo'
      }
    }
  }

export const unDetailSessionConseillerMiloQueryModel =
  (): DetailSessionConseillerMiloQueryModel => {
    return {
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
        commentaire: 'Un-commentaire'
      },
      offre: {
        id: '1',
        nom: 'Une-offre',
        theme: 'Un-theme',
        type: { code: OffreTypeCode.WORKSHOP, label: 'Atelier i-milo' },
        description: 'Une-Desc',
        nomPartenaire: 'Un-partenaire'
      }
    }
  }
