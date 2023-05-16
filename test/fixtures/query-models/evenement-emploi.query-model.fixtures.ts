import { EvenementsEmploiQueryModel } from '../../../src/application/queries/query-models/evenements-emploi.query-model'

export const desEvenementsEmploiQueryModel =
  (): EvenementsEmploiQueryModel => ({
    pagination: {
      page: 1,
      limit: 10,
      total: 1
    },
    results: [
      {
        id: 11111,
        ville: 'Paris',
        codePostal: '75012',
        type: 'Atelier',
        heureDebut: '07:00:00',
        heureFin: '09:00:00',
        dateEvenement: '2023-05-17T07:00:00.000+00:00',
        titre: 'Atelier du travail',
        modalites: ['en physique']
      }
    ]
  })
