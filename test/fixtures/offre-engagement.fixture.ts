import { OffreEngagement } from '../../src/domain/offre-engagement'
import { OffreEngagementDto } from '../../src/infrastructure/repositories/offre-engagement-http.repository'

export const uneOffreEngagement = (): OffreEngagement => ({
  adresseMission: 'adresse mission',
  adresseOrganisation: 'adresse organistation',
  codeDepartement: '75',
  codePostal: '75018',
  dateDeDebut: '2022-02-17T10:00:00.000Z',
  dateDeFin: '2022-07-17T10:00:00.000Z',
  description: 'offre très intéressante',
  descriptionOrganisation: 'description',
  domaine: 'Informatique',
  id: 'unId',
  lienAnnonce: 'lienoffre.com',
  localisation: {
    latitude: 3.4,
    longitude: 1.2
  },
  organisation: 'orga de ouf',
  titre: 'unTitre',
  urlOrganisation: 'lienorganisation.com',
  ville: 'paris'
})

export const uneOffreEngagementDto = (): OffreEngagementDto => ({
  id: 'unId',
  title: 'unTitre',
  domain: 'Informatique',
  startAt: '2022-02-17T10:00:00.000Z',
  endAt: '2022-07-17T10:00:00.000Z',
  city: 'paris',
  organizationName: 'orga de ouf',
  applicationUrl: 'lienoffre.com',
  organizationUrl: 'lienorganisation.com',
  adresse: 'adresse mission',
  organizationFullAddress: 'adresse organistation',
  postalCode: '75018',
  description: 'offre très intéressante',
  departmentCode: '75',
  organizationDescription: 'description',
  location: {
    lon: 1.2,
    lat: 3.4
  }
})
