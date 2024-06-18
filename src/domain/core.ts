export namespace Core {
  export enum Structure {
    MILO = 'MILO',
    SUPPORT = 'SUPPORT',
    POLE_EMPLOI = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA',
    POLE_EMPLOI_AIJ = 'POLE_EMPLOI_AIJ'
  }

  export const structuresPoleEmploiBRSA = [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_BRSA
  ]
  export type StructuresPoleEmploiBRSA =
    | Core.Structure.POLE_EMPLOI
    | Core.Structure.POLE_EMPLOI_BRSA

  export interface Id {
    id: string
  }
}

export function estMilo(structure: Core.Structure): boolean {
  return structure === Core.Structure.MILO
}

export function estPoleEmploi(structure: Core.Structure): boolean {
  return structure === Core.Structure.POLE_EMPLOI
}

export function estBRSA(structure: Core.Structure): boolean {
  return structure === Core.Structure.POLE_EMPLOI_BRSA
}

export function estPoleEmploiBRSA(structure: Core.Structure): boolean {
  return [Core.Structure.POLE_EMPLOI, Core.Structure.POLE_EMPLOI_BRSA].includes(
    structure
  )
}

export function estNonBRSA(structure: Core.Structure): boolean {
  return structure !== Core.Structure.POLE_EMPLOI_BRSA
}
