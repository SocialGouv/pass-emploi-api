export namespace PartenaireImmersion {
  export interface DtoV2 {
    rome: string
    romeLabel: string
    naf: string
    nafLabel: string
    siret: string
    name: string
    locationId: string | null
    customizedName?: string
    voluntaryToImmersion: boolean
    position: { lat: number; lon: number }
    address: {
      streetNumberAndAddress: string
      postcode: string
      departmentCode: string
      city: string
    }
    contactMode?: ContactMode
    distance_m?: number
    numberOfEmployeeRange?: string
    appellations: Array<{
      appellationLabel: string
      appellationCode: string
    }>
  }

  export enum ContactMode {
    UNKNOWN = 'UNKNOWN',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    IN_PERSON = 'IN_PERSON'
  }
}
