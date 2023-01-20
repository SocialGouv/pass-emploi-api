import { Agence } from '../../src/domain/agence'

export const uneAgence = (args: Partial<Agence> = {}): Agence => {
  const defaults: Agence = {
    id: 'un-id-d-agence',
    nom: 'un-nom-d-agence'
  }

  return { ...defaults, ...args }
}
