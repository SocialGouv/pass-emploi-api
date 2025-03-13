export namespace Core {
  export enum Structure {
    MILO = 'MILO',
    POLE_EMPLOI = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA',
    POLE_EMPLOI_AIJ = 'POLE_EMPLOI_AIJ',
    CONSEIL_DEPT = 'CONSEIL_DEPT',
    AVENIR_PRO = 'AVENIR_PRO',
    FT_ACCOMPAGNEMENT_INTENSIF = 'FT_ACCOMPAGNEMENT_INTENSIF',
    FT_ACCOMPAGNEMENT_GLOBAL = 'FT_ACCOMPAGNEMENT_GLOBAL',
    FT_EQUIP_EMPLOI_RECRUT = 'FT_EQUIP_EMPLOI_RECRUT'
  }

  export const structuresBeneficiaireFTConnect = [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.CONSEIL_DEPT,
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.POLE_EMPLOI_AIJ,
    Core.Structure.AVENIR_PRO,
    Core.Structure.CONSEIL_DEPT,
    Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF,
    Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL,
    Core.Structure.FT_EQUIP_EMPLOI_RECRUT
  ]

  export type StructuresPoleEmploi =
    | Core.Structure.POLE_EMPLOI
    | Core.Structure.POLE_EMPLOI_BRSA
    | Core.Structure.POLE_EMPLOI_AIJ
    | Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF
    | Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL
    | Core.Structure.FT_EQUIP_EMPLOI_RECRUT

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
    estFranceTravail(structure) ||
    structure === Core.Structure.CONSEIL_DEPT ||
    structure === Core.Structure.AVENIR_PRO
  )
}

export const structuresFT = [
  Core.Structure.POLE_EMPLOI,
  Core.Structure.POLE_EMPLOI_BRSA,
  Core.Structure.POLE_EMPLOI_AIJ,
  Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF,
  Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL,
  Core.Structure.FT_EQUIP_EMPLOI_RECRUT
]

export function estFranceTravail(structure: Core.Structure): boolean {
  return structuresFT.includes(structure)
}

export function estPassEmploi(structure: Core.Structure): boolean {
  return [
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.POLE_EMPLOI_AIJ,
    Core.Structure.CONSEIL_DEPT,
    Core.Structure.AVENIR_PRO,
    Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF,
    Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL,
    Core.Structure.FT_EQUIP_EMPLOI_RECRUT
  ].includes(structure)
}

export function getStructureDeReference(
  structure: Core.Structure
): Core.Structure {
  if (estFranceTravail(structure)) {
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

export const structuresCampagnes = [
  Core.Structure.MILO,
  Core.Structure.POLE_EMPLOI,
  Core.Structure.POLE_EMPLOI_BRSA,
  Core.Structure.POLE_EMPLOI_AIJ
]

export function peutVoirLesCampagnes(structure: Core.Structure): boolean {
  return structuresCampagnes.includes(structure)
}
