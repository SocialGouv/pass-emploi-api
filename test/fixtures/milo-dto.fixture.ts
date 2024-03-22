import {
  InscritSessionMiloDto,
  ListeSessionsConseillerMiloDto,
  ListeSessionsJeuneMiloDto,
  MILO_INSCRIT,
  OffreDto,
  OffreTypeCode,
  SessionConseillerDetailDto,
  SessionDto,
  SessionJeuneDetailDto,
  SessionJeuneListeDto,
  StructureConseillerMiloDto
} from 'src/infrastructure/clients/dto/milo.dto'

export const uneSessionDto: SessionDto = {
  id: 1,
  nom: 'Une-session',
  dateHeureDebut: '2020-04-06 10:20:00',
  dateHeureFin: '2020-04-08 10:20:00',
  dateMaxInscription: '2020-04-07',
  animateur: 'Un-animateur',
  lieu: 'Un-lieu',
  nbPlacesDisponibles: 10,
  commentaire: 'Un-commentaire',
  instances: null
}

export const uneOffreDto: OffreDto = {
  id: 1,
  nom: 'Une-offre',
  theme: 'Un-theme',
  type: 'WORKSHOP' as OffreTypeCode,
  description: 'Une-Desc',
  nomPartenaire: 'Un-partenaire'
}

export const unDetailSessionConseillerDto: SessionConseillerDetailDto = {
  session: uneSessionDto,
  offre: uneOffreDto
}

export const uneSessionListeJeuneDto: SessionJeuneListeDto = {
  session: uneSessionDto,
  offre: uneOffreDto,
  sessionInstance: { statut: MILO_INSCRIT }
}

export const unDetailSessionJeuneDto: SessionJeuneDetailDto = {
  session: uneSessionDto,
  offre: uneOffreDto
}

export const uneListeSessionsConseillerDto: ListeSessionsConseillerMiloDto = {
  page: 1,
  nbSessions: 1,
  sessions: [unDetailSessionConseillerDto]
}

export const uneListeSessionsJeuneDto: ListeSessionsJeuneMiloDto = {
  page: 1,
  nbSessions: 1,
  sessions: [uneSessionListeJeuneDto]
}

export const uneStructureConseillerMiloDto = (
  args: Partial<StructureConseillerMiloDto> = {}
): StructureConseillerMiloDto => {
  const defaults: StructureConseillerMiloDto = {
    code: '1',
    nomOfficiel: 'ML_SUE',
    nomUsuel: '',
    principale: false
  }

  return { ...defaults, ...args }
}

export const uneListeDeStructuresConseillerMiloDto: StructureConseillerMiloDto[] =
  [
    uneStructureConseillerMiloDto(),
    uneStructureConseillerMiloDto({ code: '2', principale: true })
  ]

export const uneInscriptionSessionMiloDto = (
  args: Partial<InscritSessionMiloDto> = {}
): InscritSessionMiloDto => {
  const defaults = {
    idDossier: 123456,
    idInstanceSession: 67890,
    nom: 'Granger',
    prenom: 'Hermione',
    statut: MILO_INSCRIT
  }

  return { ...defaults, ...args }
}
