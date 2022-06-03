import { TypeDemarcheDto } from '../../src/infrastructure/clients/dto/pole-emploi.dto'

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
