export namespace PartenaireImmersion {
  export interface DtoV1 {
    rome: string
    romeLabel: string
    appellationLabels: string[]
    naf: string
    nafLabel: string
    siret: string
    name: string
    voluntaryToImmersion: boolean
    position: { lat: number; lon: number }
    address: string
    city: string
    customizedName?: string
    distance_m?: number
    contactMode?: ContactMode
    contactDetails:
      | {
          id: string
          lastName: string
          firstName: string
          role: string
          email?: string
          phone?: string
        }
      | undefined
    numberOfEmployeeRange?: string
  }

  export interface Dto {
    id: string
    rome: string
    romeLabel: string
    naf: string
    nafLabel: string
    siret: string
    name: string
    voluntaryToImmersion: boolean
    location?: { lat: number; lon: number }
    address: string
    city: string
    distance_m?: number
    contactId?: string
    contactMode?: ContactMode
    contactDetails:
      | {
          id?: string
          lastName?: string
          firstName?: string
          role?: string
          email?: string
          phone?: string
        }
      | undefined
  }

  export enum ContactMode {
    UNKNOWN = 'UNKNOWN',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    IN_PERSON = 'IN_PERSON'
  }
}
