import {
  OffreTypeCode,
  SessionConseillerMiloListeDto,
  StructureConseillerMiloDto
} from '../../src/infrastructure/clients/dto/milo.dto'

export const unDetailSessionConseillerDto = {
  session: {
    id: 1,
    nom: 'Une-session',
    dateHeureDebut: '2020-04-06 10:20:00',
    dateHeureFin: '2020-04-08 10:20:00',
    dateMaxInscription: '2020-04-07T10:20:00.000Z',
    animateur: 'Un-animateur',
    lieu: 'Un-lieu',
    nbPlacesDisponibles: 10,
    commentaire: 'Un-commentaire'
  },
  offre: {
    id: 1,
    nom: 'Une-offre',
    theme: 'Un-theme',
    type: 'WORKSHOP' as OffreTypeCode,
    description: 'Une-Desc',
    nomPartenaire: 'Un-partenaire'
  }
}

export const uneSessionConseillerListeDto: SessionConseillerMiloListeDto = {
  page: 1,
  nbSessions: 1,
  sessions: [unDetailSessionConseillerDto]
}

export const uneStructureConseillerMiloDto = (
  args: Partial<StructureConseillerMiloDto> = {}
): StructureConseillerMiloDto => {
  const defaults: StructureConseillerMiloDto = {
    id: 1,
    nomOfficiel: 'ML_SUE',
    nomUsuel: '',
    principale: false
  }

  return { ...defaults, ...args }
}

export const uneListeDeStructuresConseillerMiloDto: StructureConseillerMiloDto[] =
  [
    uneStructureConseillerMiloDto(),
    uneStructureConseillerMiloDto({ id: 2, principale: true })
  ]
