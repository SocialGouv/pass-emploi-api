export namespace Core {
  export enum Structure {
    MILO = 'MILO',
    SUPPORT = 'SUPPORT',
    POLE_EMPLOI = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA',
    POLE_EMPLOI_AIJ = 'POLE_EMPLOI_AIJ'
  }

  export const structuresPoleEmploi = [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_AIJ,
    Core.Structure.POLE_EMPLOI_BRSA
  ]
  export type StructuresPoleEmploi =
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
  return [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.POLE_EMPLOI_AIJ
  ].includes(structure)
}

export function estPassEmploi(structure: Core.Structure): boolean {
  return [
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.POLE_EMPLOI_AIJ
  ].includes(structure)
}

export function aAccesAuxAlternancesEtServicesCiviques(
  structure: Core.Structure
): boolean {
  return [
    Core.Structure.MILO,
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_AIJ
  ].includes(structure)
}
