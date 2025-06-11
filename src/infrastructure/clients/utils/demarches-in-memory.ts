import { ThematiqueQueryModel } from '../../../application/queries/query-models/catalogue.query-model'

export const catalogueDemarchesInMemory: ThematiqueQueryModel[] = [
  {
    code: 'P01',
    libelle: 'Mon (nouveau) métier',
    demarches: [
      {
        codePourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        codeQuoi: 'Q01',
        libelleQuoi: 'Identification de ses points forts et de ses compétences',
        commentObligatoire: true,
        comment: [
          {
            code: 'C01.05',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        codeQuoi: 'Q02',
        libelleQuoi: "Information sur un métier ou un secteur d'activité",
        commentObligatoire: true,
        comment: [
          {
            code: 'C02.04',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        codeQuoi: 'Q03',
        libelleQuoi: 'Observation en entreprise',
        commentObligatoire: true,
        comment: [
          {
            code: 'C03.01',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        codeQuoi: 'Q04',
        libelleQuoi: 'Enquête métier afin de mieux connaître un métier',
        commentObligatoire: true,
        comment: [
          {
            code: 'C04.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        codeQuoi: 'Q05',
        libelleQuoi:
          "Participation à un salon ou un forum pour s'informer sur un métier",
        commentObligatoire: false,
        comment: []
      }
    ]
  },
  {
    code: 'P02',
    libelle: 'Ma formation professionnelle',
    demarches: [
      {
        codePourquoi: 'P02',
        libellePourquoi: 'Ma formation professionnelle',
        codeQuoi: 'Q06',
        libelleQuoi:
          "Information sur un projet de formation ou de Validation des acquis de l'expérience",
        commentObligatoire: true,
        comment: [
          {
            code: 'C06.04',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P02',
        libellePourquoi: 'Ma formation professionnelle',
        codeQuoi: 'Q37',
        libelleQuoi: "Initiation à l'informatique ou à Internet",
        commentObligatoire: true,
        comment: [
          {
            code: 'C37.04',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P02',
        libellePourquoi: 'Ma formation professionnelle',
        codeQuoi: 'Q07',
        libelleQuoi: "Montage d'un dossier d’inscription à une formation",
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P02',
        libellePourquoi: 'Ma formation professionnelle',
        codeQuoi: 'Q08',
        libelleQuoi: 'Participation à une formation',
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P02',
        libellePourquoi: 'Ma formation professionnelle',
        codeQuoi: 'Q09',
        libelleQuoi: 'Participation à un salon ou un forum formation',
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P02',
        libellePourquoi: 'Ma formation professionnelle',
        codeQuoi: 'Q10',
        libelleQuoi: "Réalisation d'une démarche de VAE",
        commentObligatoire: false,
        comment: []
      }
    ]
  },
  {
    code: 'P03',
    libelle: 'Mes candidatures',
    demarches: [
      {
        codePourquoi: 'P03',
        libellePourquoi: 'Mes candidatures',
        codeQuoi: 'Q11',
        libelleQuoi:
          'Préparation de ses candidatures (CV, lettre de motivation, book)',
        commentObligatoire: true,
        comment: [
          {
            code: 'C11.05',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P03',
        libellePourquoi: 'Mes candidatures',
        codeQuoi: 'Q12',
        libelleQuoi: "Recherche d'offres d'emploi ou d'entreprises",
        commentObligatoire: true,
        comment: [
          {
            code: 'C12.06',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P03',
        libellePourquoi: 'Mes candidatures',
        codeQuoi: 'Q14',
        libelleQuoi: "Réponse à des offres d'emploi",
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P03',
        libellePourquoi: 'Mes candidatures',
        codeQuoi: 'Q15',
        libelleQuoi: 'Candidatures spontanées',
        commentObligatoire: true,
        comment: [
          {
            code: 'C15.04',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P03',
        libellePourquoi: 'Mes candidatures',
        codeQuoi: 'Q16',
        libelleQuoi:
          'Réalisation du suivi de ses candidatures et relance des recruteurs',
        commentObligatoire: true,
        comment: [
          {
            code: 'C16.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P03',
        libellePourquoi: 'Mes candidatures',
        codeQuoi: 'Q42',
        libelleQuoi: 'Recherche de missions de service civique',
        commentObligatoire: false,
        comment: []
      }
    ]
  },
  {
    code: 'P04',
    libelle: "Mes entretiens d'embauche",
    demarches: [
      {
        codePourquoi: 'P04',
        libellePourquoi: "Mes entretiens d'embauche",
        codeQuoi: 'Q17',
        libelleQuoi: "Préparation des entretiens d'embauche",
        commentObligatoire: true,
        comment: [
          {
            code: 'C17.04',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P04',
        libellePourquoi: "Mes entretiens d'embauche",
        codeQuoi: 'Q18',
        libelleQuoi: "Réalisation d'entretiens d'embauche",
        commentObligatoire: true,
        comment: [
          {
            code: 'C18.03',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P04',
        libellePourquoi: "Mes entretiens d'embauche",
        codeQuoi: 'Q19',
        libelleQuoi: 'Passation de tests de recrutement (concours, casting…)',
        commentObligatoire: true,
        comment: [
          {
            code: 'C19.01',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P04',
        libellePourquoi: "Mes entretiens d'embauche",
        codeQuoi: 'Q20',
        libelleQuoi: 'Relance des recruteurs suite à ses entretiens',
        commentObligatoire: true,
        comment: [
          {
            code: 'C20.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P04',
        libellePourquoi: "Mes entretiens d'embauche",
        codeQuoi: 'Q21',
        libelleQuoi:
          "Réalisation d'une mise en situation professionnelle dans une entreprise",
        commentObligatoire: false,
        comment: []
      }
    ]
  },
  {
    code: 'P05',
    libelle: "Ma création ou reprise d'entreprise",
    demarches: [
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q22',
        libelleQuoi: 'Recherches pour créer ou reprendre une entreprise',
        commentObligatoire: true,
        comment: [
          {
            code: 'C22.05',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q23',
        libelleQuoi:
          "Réalisation d'une étude de marché auprès de prospects/clients /fournisseurs",
        commentObligatoire: true,
        comment: [
          {
            code: 'C23.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q24',
        libelleQuoi:
          "Participation à un salon ou forum pour s'informer sur la création entreprise",
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q25',
        libelleQuoi:
          "Réalisation d'un business plan afin de préparer la création de son entreprise",
        commentObligatoire: true,
        comment: [
          {
            code: 'C25.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q26',
        libelleQuoi: 'Prise de RDV avec des organismes financiers',
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q27',
        libelleQuoi:
          "Réalisation de démarches juridiques de création d'entreprise",
        commentObligatoire: true,
        comment: [
          {
            code: 'C27.04',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q28',
        libelleQuoi:
          "Réalisation d'actions de communication pour faire connaitre son entreprise",
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q29',
        libelleQuoi: 'Prospection pour développer sa clientèle',
        commentObligatoire: true,
        comment: [
          {
            code: 'C29.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q30',
        libelleQuoi: 'Développement de nouveaux partenariats',
        commentObligatoire: true,
        comment: [
          {
            code: 'C30.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q31',
        libelleQuoi:
          "Mise en œuvre d'actions de fidélisation de ses clients ou utilisateurs",
        commentObligatoire: false,
        comment: []
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q32',
        libelleQuoi:
          'Organisation de son activité de dirigeant et de gestion de son entreprise',
        commentObligatoire: true,
        comment: [
          {
            code: 'C32.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q33',
        libelleQuoi:
          'Diversification de ses activités en proposant de nouveaux services ou produits',
        commentObligatoire: true,
        comment: [
          {
            code: 'C33.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q34',
        libelleQuoi:
          'Développement de son entreprise en procédant à des recrutements',
        commentObligatoire: true,
        comment: [
          {
            code: 'C34.02',
            label: 'Par un autre moyen'
          }
        ]
      },
      {
        codePourquoi: 'P05',
        libellePourquoi: "Ma création ou reprise d'entreprise",
        codeQuoi: 'Q35',
        libelleQuoi:
          "Réalisation d'autres actions pour développer son entreprise",
        commentObligatoire: true,
        comment: [
          {
            code: 'C35.02',
            label: 'Par un autre moyen'
          }
        ]
      }
    ]
  },
  {
    code: 'P06',
    libelle: 'Mes entretiens avec un conseiller',
    demarches: []
  }
]
