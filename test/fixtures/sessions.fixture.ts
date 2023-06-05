import { SessionConseillerMiloQueryModel } from '../../src/application/queries/milo/get-sessions.milo.query.handler'

export const uneSessionConseillerMiloQueryModel =
  (): SessionConseillerMiloQueryModel => {
    return {
      id: '1',
      nom: 'Une-session',
      dateHeureDebut: '2020-04-06T10:20:00.000Z',
      dateHeureFin: '2020-04-08T10:20:00.000Z',
      dateMaxInscription: '2020-04-07T10:20:00.000Z',
      animateur: 'Un-animateur',
      lieu: 'Un-lieu',
      nbPlacesDisponibles: 10,
      commentaire: 'Un-commentaire'
    }
  }
