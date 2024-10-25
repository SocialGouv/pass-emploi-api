import {
  ConseillerJeuneQueryModel,
  DetailJeuneConseillerQueryModel,
  DetailJeuneQueryModel,
  JeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-model'

export function unConseillerJeuneQueryModel(
  args: Partial<ConseillerJeuneQueryModel> = {}
): ConseillerJeuneQueryModel {
  const defaults: ConseillerJeuneQueryModel = {
    id: 'ABCDE',
    prenom: 'Blanche',
    nom: 'Neige',
    email: 'blanche.neige@sept.nains',
    depuis: '2022-03-01T02:24:00.000Z'
  }
  return { ...defaults, ...args }
}

export function unDetailJeuneQueryModel(
  args: Partial<DetailJeuneQueryModel> = {}
): DetailJeuneQueryModel {
  const defaults: DetailJeuneQueryModel = {
    id: 'ABCDE',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@plop.io',
    creationDate: '2021-11-11T08:03:30.000Z',
    datePremiereConnexion: '2021-11-11T08:03:30.000Z',
    lastActivity: '2022-03-01T03:24:00.000+00:00',
    isActivated: true,
    isReaffectationTemporaire: false,
    conseiller: unConseillerJeuneQueryModel(),
    urlDossier: undefined,
    idPartenaire: '1234',
    structureMilo: undefined,
    dateFinCEJ: undefined,
    estAArchiver: undefined,
    dateSignatureCGU: undefined
  }

  return { ...defaults, ...args }
}

export function unDetailJeuneConseillerQueryModel(
  args: Partial<DetailJeuneConseillerQueryModel> = {}
): DetailJeuneConseillerQueryModel {
  const defaults: DetailJeuneConseillerQueryModel = {
    id: 'ABCDE',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@plop.io',
    creationDate: '2021-11-11T08:03:30.000Z',
    dateFinCEJ: '2022-06-11T00:00:00.000+00:00',
    isActivated: true,
    isReaffectationTemporaire: false,
    situationCourante: undefined,
    structureMilo: undefined,
    lastActivity: '2022-03-01T02:24:00.000Z'
  }

  return { ...defaults, ...args }
}

export function unJeuneQueryModel(
  args: Partial<JeuneQueryModel> = {}
): JeuneQueryModel {
  const defaults: JeuneQueryModel = {
    id: 'ABCDE',
    firstName: 'John',
    lastName: 'Doe',
    idConseiller: 'id-conseiller'
  }

  return { ...defaults, ...args }
}
