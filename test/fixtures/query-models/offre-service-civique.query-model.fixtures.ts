import {
  DetailServiceCiviqueQueryModel,
  ServiceCiviqueQueryModel
} from '../../../src/application/queries/query-models/service-civique.query-model'

export const offresServicesCiviqueQueryModel =
  (): ServiceCiviqueQueryModel[] => [uneOffreServiceCiviqueQueryModel()]

export const uneOffreServiceCiviqueQueryModel =
  (): ServiceCiviqueQueryModel => ({
    ville: 'Paris',
    domaine: 'Informatique',
    dateDeDebut: '2022-02-23T10:00:00Z',
    titre: "Assistance à l'installation de matériel",
    id: 'plopplop',
    organisation: 'orga de ouf'
  })

export const unDetailOffreServiceCiviqueQuerymodel =
  (): DetailServiceCiviqueQueryModel => ({
    titre: 'unTitre',
    dateDeDebut: '2022-02-17T10:00:00.000Z',
    dateDeFin: '2022-07-17T10:00:00.000Z',
    domaine: 'Informatique',
    ville: 'paris',
    organisation: 'orga de ouf',
    lienAnnonce: 'lienoffre.com',
    urlOrganisation: 'lienorganisation.com',
    adresseMission: 'adresse mission',
    adresseOrganisation: 'adresse organistation',
    codeDepartement: '75',
    description: 'offre très intéressante',
    codePostal: '75018',
    descriptionOrganisation: 'description organisation'
  })
