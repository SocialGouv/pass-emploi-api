import {
  RendezVousConseillerFutursEtPassesQueryModel,
  RendezVousConseillerQueryModel
} from 'src/application/queries/query-models/rendez-vous.query-models'
import {
  RendezVous,
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from '../../src/domain/rendez-vous'
import { unJeune } from './jeune.fixture'

export const unRendezVous = (
  args: Partial<RendezVous> = {},
  jeune = unJeune()
): RendezVous => {
  const defaults = {
    id: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
    titre: 'rdv',
    duree: 30,
    modalite: 'modalite',
    date: new Date('2021-11-11T08:03:30.000Z'),
    jeune: jeune,
    jeunes: [jeune],
    commentaire: 'commentaire',
    sousTitre: 'sous titre',
    type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
    presenceConseiller: true,
    adresse: undefined,
    organisme: undefined,
    createur: {
      id: '1',
      nom: 'Tavernier',
      prenom: 'Nils'
    }
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
    presenceConseiller: true
  }
  return { ...defaults, ...args }
}

export const unRendezVousConseillerFutursEtPassesQueryModel =
  (): RendezVousConseillerFutursEtPassesQueryModel => ({
    futurs: [unRendezVousConseillerQueryModel()],
    passes: [unRendezVousConseillerQueryModel()]
  })
