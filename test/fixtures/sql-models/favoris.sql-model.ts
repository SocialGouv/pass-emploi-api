import { FavoriOffreEmploiSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function unFavoriOffreEmploi(
  args: Partial<AsSql<FavoriOffreEmploiSqlModel>> = {}
): AsSql<FavoriOffreEmploiSqlModel> {
  const defaults: AsSql<FavoriOffreEmploiSqlModel> = {
    id: 1,
    idJeune: '1',
    idOffre: '',
    titre: '',
    typeContrat: 'aa',
    nomEntreprise: 'bc',
    duree: '2 ans',
    isAlternance: null,
    nomLocalisation: null,
    codePostalLocalisation: null,
    communeLocalisation: null,
    dateCreation: null,
    origineNom: null,
    origineLogoUrl: null
  }

  return { ...defaults, ...args }
}

export function unFavoriOffreEngagement(
  args: Partial<AsSql<FavoriOffreEngagementSqlModel>> = {}
): AsSql<FavoriOffreEngagementSqlModel> {
  const defaults: AsSql<FavoriOffreEngagementSqlModel> = {
    id: 1,
    idJeune: '1',
    idOffre: '',
    titre: '',
    domaine: 'infra',
    ville: null,
    organisation: null,
    dateDeDebut: null,
    dateCreation: null
  }

  return { ...defaults, ...args }
}

export function unFavoriOffreImmersion(
  args: Partial<AsSql<FavoriOffreImmersionSqlModel>> = {}
): AsSql<FavoriOffreImmersionSqlModel> {
  const defaults: AsSql<FavoriOffreImmersionSqlModel> = {
    id: 1,
    idJeune: '1',
    idOffre: '',
    metier: 'boulanger',
    ville: '',
    nomEtablissement: '',
    secteurActivite: 'patisserie',
    dateCreation: null
  }

  return { ...defaults, ...args }
}
