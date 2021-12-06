import { Authentification } from '../../src/domain/authentification'

export const unUtilisateurConseiller = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: '1',
    nom: 'Tavernier',
    prenom: 'Nils',
    type: Authentification.Type.CONSEILLER,
    email: 'nils.tavernier@passemploi.com',
    structure: Authentification.Structure.MILO
  }

  return { ...defaults, ...args }
}

export const unUtilisateurJeune = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: 'ABCDE',
    nom: 'Doe',
    prenom: 'John',
    type: Authentification.Type.JEUNE,
    email: 'john.doe@passemploi.com',
    structure: Authentification.Structure.MILO
  }

  return { ...defaults, ...args }
}
