import { PartenaireImmersion } from '../../src/infrastructure/repositories/dto/immersion.dto'

// todo a supprimer si plus utiliser
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

export const uneOffreImmersionDtov2 = (): PartenaireImmersion.DtoV2 => ({
  romeLabel: 'rome',
  nafLabel: 'naf',
  name: 'name',
  address: {
    streetNumberAndAddress: 'street',
    postcode: 'post code',
    departmentCode: 'string',
    city: 'city'
  },
  voluntaryToImmersion: true,
  rome: 'D1102',
  position: {
    lat: 42,
    lon: 2
  },
  naf: 'naf',
  distance_m: 3,
  siret: '123456',
  contactMode: PartenaireImmersion.ContactMode.IN_PERSON,
  appellations: [
    { appellationLabel: 'Boulanger-Traiteur', appellationCode: 'D1102' }
  ]
})
