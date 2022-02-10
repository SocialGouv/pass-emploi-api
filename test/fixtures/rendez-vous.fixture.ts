import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel
} from 'src/application/queries/query-models/rendez-vous.query-models'
import { RendezVous } from '../../src/domain/rendez-vous'
import { unJeune } from './jeune.fixture'

export const unRendezVous = (jeune = unJeune()): RendezVous => ({
  id: '1',
  titre: 'rdv',
  duree: 30,
  modalite: 'modalite',
  date: new Date('2021-11-11T08:03:30.000Z'),
  jeune: jeune,
  commentaire: 'commentaire',
  sousTitre: 'sous titre'
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
  }
})

export const unRendezVousConseillerQueryModel =
  (): RendezVousConseillerQueryModel => ({
    futurs: [unRendezVousQueryModel()],
    passes: [unRendezVousQueryModel()]
  })
