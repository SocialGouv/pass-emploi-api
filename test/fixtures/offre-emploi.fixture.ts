import { OffreEmploi } from '../../src/domain/offre-emploi'

export const uneOffreEmploi = (): OffreEmploi => ({
  id: '123DXPM',
  titre: 'Technicien / Technicienne en froid et climatisation',
  typeContrat: 'MIS',
  nomEntreprise: 'RH TT INTERIM',
  duree: 'Temps plein',
  localisation: {
    nom: '77 - LOGNES',
    codePostal: '77185',
    commune: '77258'
  },
  alternance: false
})
