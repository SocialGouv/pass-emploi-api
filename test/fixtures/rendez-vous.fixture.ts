import {
  RendezVousConseillerFutursEtPassesQueryModel,
  RendezVousConseillerQueryModel
} from 'src/application/queries/query-models/rendez-vous.query-model'
import {
  CodeTypeRendezVous,
  JeuneDuRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../src/domain/rendez-vous/rendez-vous'
import {
  desPreferencesJeune,
  unConseillerDuJeune,
  uneConfiguration
} from './jeune.fixture'

export const unRendezVous = (args: Partial<RendezVous> = {}): RendezVous => {
  const defaults: RendezVous = {
    id: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
    source: RendezVous.Source.PASS_EMPLOI,
    titre: 'rdv',
    duree: 30,
    modalite: 'modalite',
    date: new Date('2021-11-11T08:03:30.000Z'),
    jeunes: [unJeuneDuRendezVous()],
    commentaire: 'commentaire',
    sousTitre: 'sous titre',
    type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
    presenceConseiller: true,
    adresse: undefined,
    organisme: undefined,
    invitation: undefined,
    icsSequence: undefined,
    dateCloture: undefined,
    idAgence: undefined,
    precision: 'Ceci est une précision',
    createur: {
      id: '1',
      nom: 'Tavernier',
      prenom: 'Nils'
    },
    nombreMaxParticipants: undefined
  }
  return { ...defaults, ...args }
}

export const uneAnimationCollective = (
  args: Partial<RendezVous.AnimationCollective> = {}
): RendezVous.AnimationCollective => {
  const defaults: RendezVous.AnimationCollective = {
    id: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
    source: RendezVous.Source.PASS_EMPLOI,
    titre: 'rdv',
    duree: 30,
    modalite: 'modalite',
    date: new Date('2021-11-11T08:03:30.000Z'),
    jeunes: [unJeuneDuRendezVous()],
    commentaire: 'commentaire',
    sousTitre: 'sous titre',
    type: CodeTypeRendezVous.ATELIER,
    presenceConseiller: true,
    adresse: undefined,
    organisme: undefined,
    invitation: undefined,
    icsSequence: undefined,
    dateCloture: undefined,
    idAgence: undefined,
    precision: 'Ceci est une précision',
    createur: {
      id: '1',
      nom: 'Tavernier',
      prenom: 'Nils'
    },
    nombreMaxParticipants: undefined
  }
  return { ...defaults, ...args }
}

export const unJeuneDuRendezVous = (
  args: Partial<JeuneDuRendezVous> = {}
): JeuneDuRendezVous => {
  const defaults: JeuneDuRendezVous = {
    id: 'ABCDE',
    firstName: 'John',
    lastName: 'Doe',
    conseiller: unConseillerDuJeune(),
    configuration: uneConfiguration(),
    email: 'john.doe@plop.io',
    preferences: desPreferencesJeune()
  }

  return { ...defaults, ...args }
}

export const unRendezVousConseillerQueryModel = (
  args: Partial<RendezVousConseillerQueryModel> = {}
): RendezVousConseillerQueryModel => {
  const defaults = {
    id: '1',
    title: '',
    modality: 'modalite',
    comment: 'commentaire',
    date: new Date('2021-11-11T08:03:30.000Z'),
    duration: 30,
    invitation: false,
    jeune: {
      id: '1',
      nom: 'test',
      prenom: 'test'
    },
    jeunes: [
      {
        id: '1',
        nom: 'test',
        prenom: 'test'
      }
    ],
    type: {
      code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      label:
        mapCodeLabelTypeRendezVous[
          CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
        ]
    },
    presenceConseiller: true,
    source: RendezVous.Source.PASS_EMPLOI
  }
  return { ...defaults, ...args }
}

export const unRendezVousConseillerFutursEtPassesQueryModel =
  (): RendezVousConseillerFutursEtPassesQueryModel => ({
    futurs: [unRendezVousConseillerQueryModel()],
    passes: [unRendezVousConseillerQueryModel()]
  })
