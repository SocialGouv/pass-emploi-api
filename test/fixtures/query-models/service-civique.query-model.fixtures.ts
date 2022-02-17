import { ServiceCiviqueQueryModel } from '../../../src/application/queries/query-models/service-civique.query-models'

export const serviceCiviqueQueryModel = (): ServiceCiviqueQueryModel[] => [
  {
    ville: 'Paris',
    domaine: 'Informatique',
    dateDeDebut: '2022-02-23T10:00:00Z',
    titre: "Assistance à l'installation de matériel",
    id: 'plopplop'
  }
]
