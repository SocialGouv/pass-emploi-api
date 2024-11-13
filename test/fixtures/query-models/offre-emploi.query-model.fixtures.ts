import { OffresEmploiQueryModel } from '../../../src/application/queries/query-models/offres-emploi.query-model'

export const desOffresEmploiQueryModel = (): OffresEmploiQueryModel => ({
  pagination: {
    page: 1,
    limit: 50,
    total: 1
  },
  results: [
    {
      id: '123DXPM',
      titre: 'Technicien / Technicienne en froid et climatisation',
      typeContrat: 'MIS',
      alternance: false,
      duree: 'Temps plein',
      nomEntreprise: 'RH TT INTERIM',
      localisation: {
        nom: 'libelle',
        codePostal: '57000',
        commune: '57463'
      },
      origine: {
        nom: 'France Travail'
      }
    }
  ]
})
