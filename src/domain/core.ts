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

  export const structuresFT: readonly Structure[] = [
    Structure.POLE_EMPLOI,
    Structure.POLE_EMPLOI_BRSA,
    Structure.POLE_EMPLOI_AIJ,
    Structure.FT_ACCOMPAGNEMENT_INTENSIF,
    Structure.FT_ACCOMPAGNEMENT_GLOBAL,
    Structure.FT_EQUIP_EMPLOI_RECRUT
  ] as const

  export const structuresBeneficiaireFTConnect = [
    ...structuresFT,
    Structure.CONSEIL_DEPT,
    Structure.AVENIR_PRO
  ]

  export type StructuresFT = (typeof structuresFT)[number]

  export interface Id {
    id: string
  }
}

export function estMilo(structure: Core.Structure): boolean {
  return structure === Core.Structure.MILO
}

export function beneficiaireEstFTConnect(structure: Core.Structure): boolean {
  return Core.structuresBeneficiaireFTConnect.includes(structure)
}

export function estFranceTravail(structure: Core.Structure): boolean {
  return Core.structuresFT.includes(structure)
}

export function estPassEmploi(structure: Core.Structure): boolean {
  return (
    Core.structuresBeneficiaireFTConnect.includes(structure) &&
    structure !== Core.Structure.POLE_EMPLOI
  )
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
