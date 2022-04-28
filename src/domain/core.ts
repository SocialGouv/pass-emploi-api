export namespace Core {
  export enum Structure {
    PASS_EMPLOI = 'PASS_EMPLOI',
    MILO = 'MILO',
    POLE_EMPLOI = 'POLE_EMPLOI'
  }

  export interface Id {
    id: string
  }

  export interface Localisation {
    latitude: number
    longitude: number
  }
}
