import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel
} from 'src/application/queries/query-models/rendez-vous.query-models'
import {
  RendezVous,
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from '../../src/domain/rendez-vous'
import { unJeune } from './jeune.fixture'

export const unRendezVous = (jeune = unJeune()): RendezVous => ({
  id: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
  titre: 'rdv',
  duree: 30,
  modalite: 'modalite',
  date: new Date('2021-11-11T08:03:30.000Z'),
  jeune: jeune,
  commentaire: 'commentaire',
  sousTitre: 'sous titre',
  type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
  presenceConseiller: true
})

export const unRendezVousQueryModel = (): RendezVousQueryModel => ({
  id: '1',
  title: 'rdv',
  modality: 'modalite',
  comment: 'commentaire',
  date: new Date('2021-11-11T08:03:30.000Z'),
  duration: 30,
  jeune: {
    id: '1',
    nom: 'test',
    prenom: 'test'
  },
  type: {
    code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
    label:
      mapCodeLabelTypeRendezVous[
        CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
      ]
  },
  presenceConseiller: true
})

export const unRendezVousConseillerQueryModel =
  (): RendezVousConseillerQueryModel => ({
    futurs: [unRendezVousQueryModel()],
    passes: [unRendezVousQueryModel()]
  })
