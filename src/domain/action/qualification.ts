export interface Qualification {
  code: Qualification.Code
  heures: number
}

export namespace Qualification {
  export enum Code {
    SANTE = 'SANTE',
    PROJET_PROFESSIONNEL = 'PROJET_PROFESSIONNEL',
    LOGEMENT = 'LOGEMENT',
    CITOYENNETE = 'CITOYENNETE',
    EMPLOI = 'EMPLOI',
    CULTURE_SPORT_LOISIRS = 'CULTURE_SPORT_LOISIRS',
    FORMATION = 'FORMATION',
    NON_SNP = 'NON_SNP'
  }

  export enum Etat {
    A_QUALIFIER = 'A_QUALIFIER',
    NON_QUALIFIABLE = 'NON_QUALIFIABLE',
    QUALIFEE = 'QUALIFEE'
  }

  export const mapCodeTypeQualification: Record<Code, TypeQualification> = {
    SANTE: {
      code: Code.SANTE,
      label: 'Santé',
      heures: 2
    },
    PROJET_PROFESSIONNEL: {
      code: Code.PROJET_PROFESSIONNEL,
      label: 'Projet Professionnel',
      heures: 2
    },
    LOGEMENT: {
      code: Code.LOGEMENT,
      label: 'Logement',
      heures: 2
    },
    CITOYENNETE: {
      code: Code.CITOYENNETE,
      label: 'Citoyenneté',
      heures: 2
    },
    EMPLOI: {
      code: Code.EMPLOI,
      label: 'Emploi',
      heures: 3
    },
    CULTURE_SPORT_LOISIRS: {
      code: Code.CULTURE_SPORT_LOISIRS,
      label: 'Loisir, sport, culture',
      heures: 2
    },
    FORMATION: {
      code: Code.FORMATION,
      label: 'Formation',
      heures: 3
    },
    NON_SNP: {
      code: Code.NON_SNP,
      label: 'Action non qualifiée en Situation Non Professionnelle',
      heures: 0
    }
  }

  export interface TypeQualification {
    code: Code
    label: string
    heures: number
  }
}
