import { SuggestionDto } from 'src/infrastructure/clients/dto/pole-emploi.dto'

export const suggestionsPE: SuggestionDto[] = [
  {
    appellation: {
      libelle: 'Comédien / Comédienne',
      code: '12724'
    },
    mobilites: [
      {
        rayon: 0,
        lieu: {
          code: '32',
          libelle: 'Hauts-de-France',
          type: {
            code: '3',
            libelle: 'Région'
          }
        },
        unite: {
          code: 'KM',
          libelle: 'Kilomètres'
        }
      },
      {
        rayon: 0,
        lieu: {
          code: '59220',
          codeDepartement: '59',
          codePostal: '59155',
          libelle: 'FACHES THUMESNIL',
          type: {
            code: '5',
            libelle: 'Commune'
          }
        },
        unite: {
          code: 'KM',
          libelle: 'Kilomètres'
        }
      }
    ],
    rome: {
      libelle: 'Art dramatique',
      code: 'L1203'
    },
    typologieEmploi: {
      libelle: 'Métier Recherché',
      code: 'MR'
    }
  },
  {
    appellation: {
      libelle: "Maître-chien / Maîtresse-chien d'avalanche",
      code: '16320'
    },
    mobilites: [
      {
        rayon: 0,
        lieu: {
          code: '33',
          libelle: 'Gironde',
          type: {
            code: '4',
            libelle: 'Département'
          }
        },
        unite: {
          code: 'KM',
          libelle: 'Kilomètres'
        }
      }
    ],
    rome: {
      libelle: 'Sécurité civile et secours',
      code: 'K1705'
    },
    typologieEmploi: {
      libelle: "Création ou Reprise d'Entreprise ou de Franchiseaire",
      code: 'EF'
    }
  },
  {
    mobilites: [
      {
        rayon: 0,
        lieu: {
          code: '33063',
          codeDepartement: '33',
          codePostal: '33100',
          libelle: 'BORDEAUX',
          type: {
            code: '5',
            libelle: 'Commune'
          }
        },
        unite: {
          code: 'KM',
          libelle: 'Kilomètres'
        }
      }
    ],
    typologieEmploi: {
      libelle: "Création ou Reprise d'Entreprise ou de Franchiseaire",
      code: 'EF'
    }
  }
]
