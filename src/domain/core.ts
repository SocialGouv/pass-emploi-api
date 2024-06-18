export namespace Core {
  export enum Structure {
    PASS_EMPLOI = 'PASS_EMPLOI',
    MILO = 'MILO',
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

export function estPassEmploi(structure: Core.Structure): boolean {
  return structure === Core.Structure.PASS_EMPLOI
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
export function estMiloPassEmploi(structure: Core.Structure): boolean {
  return [Core.Structure.MILO, Core.Structure.PASS_EMPLOI].includes(structure)
}
export function estPoleEmploiBRSA(structure: Core.Structure): boolean {
  return [Core.Structure.POLE_EMPLOI, Core.Structure.POLE_EMPLOI_BRSA].includes(
    structure
  )
}
export function estPoleEmploiBRSAPassEmploi(
  structure: Core.Structure
): boolean {
  return [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.PASS_EMPLOI
  ].includes(structure)
}
export function estNonBRSA(structure: Core.Structure): boolean {
  return structure !== Core.Structure.POLE_EMPLOI_BRSA
}
