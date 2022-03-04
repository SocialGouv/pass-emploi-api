import { OffresImmersion } from '../../src/domain/offre-immersion'

export const offreImmersionDto = (): OffresImmersion.Partenaire.Dto => ({
  romeLabel: 'rome',
  nafLabel: 'naf',
  id: 'id',
  name: 'name',
  city: 'Paris',
  address: 'addresse',
  voluntaryToImmersion: true,
  rome: 'D112',
  location: {
    lat: 42,
    lon: 2
  },
  naf: 'naf',
  contactId: 'contactId',
  distance_m: 3,
  siret: '123456',
  contactMode: OffresImmersion.Partenaire.ContactMode.IN_PERSON,
  contactDetails: {
    id: '1',
    lastName: 'Tavernier',
    firstName: 'Nils',
    role: 'manager'
  }
})
