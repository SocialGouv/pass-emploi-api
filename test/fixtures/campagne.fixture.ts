import { Campagne } from '../../src/domain/campagne'
import { uneDatetime } from './date.fixture'

export const uneCampagne = (args: Partial<Campagne> = {}): Campagne => {
  const defaults: Campagne = {
    id: '721e2108-60f5-4a75-b102-04fe6a40e899',
    nom: 'Premiere campagne',
    dateDebut: uneDatetime,
    dateFin: uneDatetime.plus({ week: 2 })
  }

  return { ...defaults, ...args }
}
