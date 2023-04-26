import { Authentification } from './authentification'

export namespace Core {
  export enum Structure {
    PASS_EMPLOI = 'PASS_EMPLOI',
    MILO = 'MILO',
    POLE_EMPLOI = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA'
  }

  export const structuresMiloPassEmploi = [
    Core.Structure.MILO,
    Core.Structure.PASS_EMPLOI
  ]
  export const structuresPoleEmploiBRSAPassEmploi = [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_BRSA,
    Core.Structure.PASS_EMPLOI
  ]
  export const structuresPoleEmploiBRSA = [
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_BRSA
  ]
  export const touteStructureSaufBRSA = [
    Core.Structure.MILO,
    Core.Structure.PASS_EMPLOI,
    Core.Structure.POLE_EMPLOI
  ]

  export interface Id {
    id: string
  }
}

export function estUtilisateurDeLaStructure(
  utilisateur: Authentification.Utilisateur,
  structuresAutorisees?: Core.Structure[]
): boolean {
  return (
    structuresAutorisees === undefined ||
    structuresAutorisees.includes(utilisateur.structure)
  )
}
