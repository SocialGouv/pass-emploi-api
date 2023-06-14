import { SessionConseillerMiloQueryModel } from '../../src/application/queries/query-models/sessions.milo.query.model'
import { OffreTypeCode } from '../../src/infrastructure/clients/dto/milo.dto'

export const uneSessionConseillerMiloQueryModel =
  (): SessionConseillerMiloQueryModel => {
    return {
      id: '1',
      nomSession: 'Une-session',
      nomOffre: 'Une-offre',
      dateHeureDebut: '2020-04-06T10:20:00.000Z',
      dateHeureFin: '2020-04-08T10:20:00.000Z',
      type: {
        code: OffreTypeCode.WORKSHOP,
        label: 'Atelier i-milo'
      }
    }
  }
