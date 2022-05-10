import { Milo } from '../../src/domain/milo'

export const unDossierMilo = (): Milo.Dossier => ({
  id: '1',
  nom: 'Dawson',
  prenom: 'Jack',
  dateDeNaissance: '1888-09-01',
  codePostal: '91580',
  email: 'jack.dawson@milo.com',
  situations: []
})
