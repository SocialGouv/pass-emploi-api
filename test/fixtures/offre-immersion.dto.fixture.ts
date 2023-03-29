import { PartenaireImmersion } from '../../src/infrastructure/repositories/dto/immersion.dto'

export const uneOffreImmersionDto = (): PartenaireImmersion.Dto => ({
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
  contactMode: PartenaireImmersion.ContactMode.IN_PERSON,
  contactDetails: {
    id: undefined,
    lastName: undefined,
    firstName: undefined,
    role: undefined
  }
})
