import { SuggestionDto } from 'src/infrastructure/clients/dto/pole-emploi.dto'

export const suggestionsPEInMemory: SuggestionDto[] = [
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
  },
  {
    appellation: {
      libelle: 'Boulanger',
      code: '26320'
    },
    mobilites: [
      {
        rayon: 0,
        lieu: {
          code: '92035',
          codeDepartement: '92',
          codePostal: '92250',
          libelle: 'LA GARENNE-COLOMBES',
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
      libelle: 'Cuisine',
      code: 'D2705'
    },
    typologieEmploi: {
      libelle: "Création ou Reprise d'Entreprise ou de Franchiseaire",
      code: 'EF'
    }
  },
  {
    rome: { code: 'K1303', libelle: "Assistance auprès d'enfants" },
    salaire: { code: 'H', libelle: 'Horaire', remuneration: 8.86 },
    contrats: [
      {
        type: {
          code: 'SAI',
          libelle: 'Saisonnier',
          libelleLong: 'Contrat travail saisonnier'
        },
        priorite: 5,
        critereOre: false
      },
      {
        type: {
          code: 'CDD',
          libelle: 'CDD',
          libelleLong: 'Contrat à durée déterminée'
        },
        priorite: 2,
        critereOre: false
      }
    ],
    mobilites: [
      {
        lieu: {
          code: '97608',
          type: { code: '5', libelle: 'Commune' },
          libelle: 'DZAOUDZI',
          codePostal: '97615',
          codeDepartement: '976'
        },
        rayon: 5,
        unite: { code: 'KM', libelle: 'Kilomètres' }
      }
    ],
    appellation: {
      code: '10756',
      libelle:
        'Agent spécialisé / Agente spécialisée des écoles maternelles -ASEM-'
    },
    dureesHebdo: [
      {
        critereOre: false,
        tempsTravail: { code: '2', libelle: 'temps partiel' }
      }
    ],
    dureeExperience: { unite: { code: 'MO', libelle: 'Mois' }, valeur: 36 },
    typologieEmploi: { code: 'MR', libelle: 'Métier Recherché' },
    typeCrefCreation: false,
    mobiliteHabitation: { unite: { code: 'KM' }, valeur: 10 }
  }
]
