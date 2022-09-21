import {
  SuggestionDto,
  TypeDemarcheDto
} from '../../src/infrastructure/clients/dto/pole-emploi.dto'

export const desTypesDemarchesDto = (): TypeDemarcheDto[] => [
  {
    codeCommentDemarche: 'C12.06',
    codePourQuoiObjectifDemarche: 'P03',
    codeQuoiTypeDemarche: 'Q12',
    estUneAction: false,
    libelleCommentDemarche: 'Par un autre moyen',
    libellePourQuoiObjectifDemarche: 'Mes candidatures',
    libelleQuoiTypeDemarche: "Recherche d'offres d'emploi ou d'entreprises"
  },
  {
    codeCommentDemarche: 'C12.07',
    codePourQuoiObjectifDemarche: 'P03',
    codeQuoiTypeDemarche: 'Q12',
    estUneAction: false,
    libelleCommentDemarche: 'Moyen à définir',
    libellePourQuoiObjectifDemarche: 'Mes candidatures',
    libelleQuoiTypeDemarche: "Recherche d'offres d'emploi ou d'entreprises"
  },
  {
    codeCommentDemarche: 'C13.01',
    codePourQuoiObjectifDemarche: 'P03',
    codeQuoiTypeDemarche: 'Q13',
    estUneAction: false,
    libelleCommentDemarche: 'Sur internet',
    libellePourQuoiObjectifDemarche: 'Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  },
  {
    codeCommentDemarche: 'C13.02',
    codePourQuoiObjectifDemarche: 'P03',
    codeQuoiTypeDemarche: 'Q13',
    estUneAction: false,
    libelleCommentDemarche: 'En présentiel',
    libellePourQuoiObjectifDemarche: 'Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  },
  {
    codePourQuoiObjectifDemarche: 'P03',
    codeQuoiTypeDemarche: 'Q14',
    estUneAction: false,
    libellePourQuoiObjectifDemarche: 'Mes candidatures',
    libelleQuoiTypeDemarche: "Réponse à des offres d'emploi"
  }
]

export const uneSuggestionDtoCommuneSansRayon = (): SuggestionDto => ({
  rome: {
    code: 'N1101',
    libelle: "Conduite d'engins de déplacement des charges"
  },
  contrats: [
    {
      type: {
        code: 'CDI',
        libelle: 'CDI',
        libelleLong: 'Contrat à durée indeterminée'
      },
      priorite: 1,
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
        code: '59220',
        codeDepartement: '59',
        codePostal: '59155',
        libelle: 'FACHES THUMESNIL',
        type: {
          code: '5',
          libelle: 'Commune'
        }
      }
    }
  ],
  appellation: {
    code: '11679',
    libelle: 'Cariste'
  },
  dureesHebdo: [
    {
      critereOre: false,
      tempsTravail: {
        code: '1',
        libelle: 'temps plein'
      }
    }
  ],
  dureeExperience: {
    unite: {
      code: 'AN',
      libelle: 'An(s)'
    },
    valeur: 7
  },
  typologieEmploi: {
    code: 'MR',
    libelle: 'Métier Recherché'
  },
  typeCrefCreation: false
})

export const uneSuggestionDtoCommuneAvecUnRayonInconnu = (): SuggestionDto => ({
  rome: {
    code: 'N1101',
    libelle: "Conduite d'engins de déplacement des charges"
  },
  contrats: [
    {
      type: {
        code: 'CDI',
        libelle: 'CDI',
        libelleLong: 'Contrat à durée indeterminée'
      },
      priorite: 1,
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
      unite: {
        code: 'M',
        libelle: 'Metres'
      },
      rayon: 10,
      lieu: {
        code: '59220',
        codeDepartement: '59',
        codePostal: '59155',
        libelle: 'FACHES THUMESNIL',
        type: {
          code: '5',
          libelle: 'Commune'
        }
      }
    }
  ],
  appellation: {
    code: '11679',
    libelle: 'Cariste'
  },
  dureesHebdo: [
    {
      critereOre: false,
      tempsTravail: {
        code: '1',
        libelle: 'temps plein'
      }
    }
  ],
  dureeExperience: {
    unite: {
      code: 'AN',
      libelle: 'An(s)'
    },
    valeur: 7
  },
  typologieEmploi: {
    code: 'MR',
    libelle: 'Métier Recherché'
  },
  typeCrefCreation: false
})

export const uneSuggestionDtoDeuxCommunes = (): SuggestionDto => {
  return {
    rome: {
      code: 'N1101',
      libelle: "Conduite d'engins de déplacement des charges"
    },
    contrats: [
      {
        type: {
          code: 'CDI',
          libelle: 'CDI',
          libelleLong: 'Contrat à durée indeterminée'
        },
        priorite: 1,
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
          code: '59220',
          codeDepartement: '59',
          codePostal: '59155',
          libelle: 'FACHES THUMESNIL',
          type: {
            code: '5',
            libelle: 'Commune'
          }
        }
      },
      {
        lieu: {
          code: '44300',
          codeDepartement: '44',
          codePostal: '44300',
          libelle: 'NANTES',
          type: {
            code: '5',
            libelle: 'Commune'
          }
        },
        unite: {
          code: 'KM',
          libelle: 'Kilomètres'
        },
        rayon: 10
      }
    ],
    appellation: {
      code: '11679',
      libelle: 'Cariste'
    },
    dureesHebdo: [
      {
        critereOre: false,
        tempsTravail: {
          code: '1',
          libelle: 'temps plein'
        }
      }
    ],
    dureeExperience: {
      unite: {
        code: 'AN',
        libelle: 'An(s)'
      },
      valeur: 7
    },
    typologieEmploi: {
      code: 'MR',
      libelle: 'Métier Recherché'
    },
    typeCrefCreation: false
  }
}

export const uneSuggestionDtoUneCommuneEtUnDepartement = (): SuggestionDto => {
  return {
    rome: {
      code: 'N1101',
      libelle: "Conduite d'engins de déplacement des charges"
    },
    contrats: [
      {
        type: {
          code: 'CDI',
          libelle: 'CDI',
          libelleLong: 'Contrat à durée indeterminée'
        },
        priorite: 1,
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
          code: '33',
          libelle: 'Gironde',
          type: {
            code: '4',
            libelle: 'Département'
          }
        }
      },
      {
        lieu: {
          code: '44300',
          codeDepartement: '44',
          codePostal: '44300',
          libelle: 'NANTES',
          type: {
            code: '5',
            libelle: 'Commune'
          }
        },
        unite: {
          code: 'KM',
          libelle: 'Kilomètres'
        },
        rayon: 10
      }
    ],
    appellation: {
      code: '11679',
      libelle: 'Cariste'
    },
    dureesHebdo: [
      {
        critereOre: false,
        tempsTravail: {
          code: '1',
          libelle: 'temps plein'
        }
      }
    ],
    dureeExperience: {
      unite: {
        code: 'AN',
        libelle: 'An(s)'
      },
      valeur: 7
    },
    typologieEmploi: {
      code: 'MR',
      libelle: 'Métier Recherché'
    },
    typeCrefCreation: false
  }
}

export const uneSuggestionDtoUneRegion = (): SuggestionDto => {
  return {
    rome: {
      code: 'N1101',
      libelle: "Conduite d'engins de déplacement des charges"
    },
    contrats: [
      {
        type: {
          code: 'CDI',
          libelle: 'CDI',
          libelleLong: 'Contrat à durée indeterminée'
        },
        priorite: 1,
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
          code: '75',
          libelle: 'Nouvelle Aquitaine',
          type: {
            code: '3',
            libelle: 'Région'
          }
        }
      }
    ],
    appellation: {
      code: '11679',
      libelle: 'Cariste'
    },
    dureesHebdo: [
      {
        critereOre: false,
        tempsTravail: {
          code: '1',
          libelle: 'temps plein'
        }
      }
    ],
    dureeExperience: {
      unite: {
        code: 'AN',
        libelle: 'An(s)'
      },
      valeur: 7
    },
    typologieEmploi: {
      code: 'MR',
      libelle: 'Métier Recherché'
    },
    typeCrefCreation: false
  }
}
