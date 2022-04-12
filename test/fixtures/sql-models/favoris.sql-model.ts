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
    typeContrat: '',
    nomEntreprise: '',
    duree: '',
    isAlternance: null,
    nomLocalisation: null,
    codePostalLocalisation: null,
    communeLocalisation: null
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
    domaine: '',
    ville: null,
    organisation: null,
    dateDeDebut: null
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
    metier: '',
    ville: '',
    nomEtablissement: '',
    secteurActivite: ''
  }

  return { ...defaults, ...args }
}
