export namespace Core {
  export enum Structure {
    MILO = 'MILO',
    SUPPORT = 'SUPPORT',
    POLE_EMPLOI = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA',
    POLE_EMPLOI_AIJ = 'POLE_EMPLOI_AIJ',
    CONSEIL_DEPT = 'CONSEIL_DEPT',
    AVENIR_PRO = 'AVENIR_PRO'
  }

  export const structuresBeneficiaireFranceTravail = [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.CONSEIL_DEPT,
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.POLE_EMPLOI_AIJ,
    Core.Structure.AVENIR_PRO
  ]
  export type StructuresPoleEmploi =
    | Core.Structure.POLE_EMPLOI
    | Core.Structure.POLE_EMPLOI_BRSA
    | Core.Structure.POLE_EMPLOI_AIJ

  export interface Id {
    id: string
  }
}

export function estMilo(structure: Core.Structure): boolean {
  return structure === Core.Structure.MILO
}

export function estPoleEmploiOuCDOuAvenirPro(
  structure: Core.Structure
): boolean {
  return (
    estPoleEmploi(structure) ||
    structure === Core.Structure.CONSEIL_DEPT ||
    structure === Core.Structure.AVENIR_PRO
  )
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
    Core.Structure.POLE_EMPLOI_AIJ,
    Core.Structure.CONSEIL_DEPT,
    Core.Structure.AVENIR_PRO
  ].includes(structure)
}

export function getStructureDeReference(
  structure: Core.Structure
): Core.Structure {
  if (estPoleEmploi(structure)) {
    return Core.Structure.POLE_EMPLOI
  }
  return structure
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

export function peutVoirLesCampagnes(structure: Core.Structure): boolean {
  return [
    Core.Structure.MILO,
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_BRSA
  ].includes(structure)
}
