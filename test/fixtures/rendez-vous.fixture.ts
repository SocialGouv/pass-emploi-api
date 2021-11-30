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
