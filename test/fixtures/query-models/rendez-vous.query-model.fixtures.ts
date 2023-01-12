import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import {
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel
} from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { uneDate } from '../date.fixture'

export function unRendezVousQueryModel(
  args: Partial<RendezVousJeuneQueryModel> = {}
): RendezVousJeuneQueryModel {
  const defaults: RendezVousJeuneQueryModel = {
    adresse: undefined,
    comment: 'commentaire',
    conseiller: {
      id: '1',
      nom: 'Tavernier',
      prenom: 'Nils'
    },
    createur: {
      id: '1',
      nom: 'Tavernier',
      prenom: 'Nils'
    },
    date: new Date('2022-08-16T12:00:00.000Z'),
    duration: 30,
    id: 'db5c33e3-9fa2-4853-86b3-6cbe9c3cddc9',
    invitation: false,
    isLocaleDate: false,
    modality: 'modalite',
    organisme: undefined,
    precision: undefined,
    presenceConseiller: true,
    title: 'rdv',
    type: {
      code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      label: 'Entretien individuel conseiller'
    },
    source: RendezVous.Source.PASS_EMPLOI,
    futPresent: undefined
  }

  return { ...defaults, ...args }
}

export const unRendezVousJeuneDetailQueryModel = (
  args: Partial<RendezVousJeuneDetailQueryModel> = {}
): RendezVousJeuneDetailQueryModel => {
  const defaults: RendezVousJeuneDetailQueryModel = {
    id: 'id',
    title: 'titre',
    modality: 'en voiture',
    date: uneDate(),
    duration: 30,
    type: { code: CodeTypeRendezVous.ATELIER, label: 'Atelier' },
    isLocaleDate: false,
    estInscrit: false,
    organisme: undefined,
    precision: undefined,
    presenceConseiller: true,
    invitation: false,
    createur: {
      id: '1',
      nom: 'Tavernier',
      prenom: 'Nils'
    },
    comment: 'commentaire',
    adresse: undefined,
    source: RendezVous.Source.PASS_EMPLOI
  }

  return { ...defaults, ...args }
}
