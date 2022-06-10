import { TypeDemarcheDto } from '../infrastructure/clients/dto/pole-emploi.dto'

export const desTypeDemarchesDtosMock = (): TypeDemarcheDto[] => [
  {
    codeCommentDemarche: 'FAKE-C12.06',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q12',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-Par un autre moyen',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Recherche d'offres d'emploi ou d'entreprises"
  },
  {
    codeCommentDemarche: 'FAKE-C12.07',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q12',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-Moyen à définir',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Recherche d'offres d'emploi ou d'entreprises"
  },
  {
    codeCommentDemarche: 'FAKE-C13.01',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q13',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-Sur internet',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  },
  {
    codeCommentDemarche: 'FAKE-C13.02',
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q13',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-En présentiel',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  },
  {
    codePourQuoiObjectifDemarche: 'FAKE-P03',
    codeQuoiTypeDemarche: 'FAKE-Q14',
    estUneAction: false,
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Réponse à des offres d'emploi"
  },
  {
    codePourQuoiObjectifDemarche: 'FAKE-P21',
    codeQuoiTypeDemarche: 'FAKE-Q21',
    estUneAction: false,
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche: "Réponse à des offres d'emploi"
  },
  {
    codeCommentDemarche: 'FAKE-C21.02',
    codePourQuoiObjectifDemarche: 'FAKE-P21',
    codeQuoiTypeDemarche: 'FAKE-Q21',
    estUneAction: false,
    libelleCommentDemarche: 'FAKE-En présentiel',
    libellePourQuoiObjectifDemarche: 'FAKE-Mes candidatures',
    libelleQuoiTypeDemarche:
      'Participation à un salon ou un forum pour rechercher des offres'
  }
]
