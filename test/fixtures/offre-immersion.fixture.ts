import { ObsoleteFavoriOffreImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-model'
import { NotifierNouvellesImmersionsCommand } from '../../src/application/commands/notifier-nouvelles-immersions.command.handler'
import { Immersion } from '../../src/domain/offre/favori/offre-immersion'

export const uneNouvelleImmersionCommand =
  (): NotifierNouvellesImmersionsCommand => ({
    immersions: [
      {
        rome: 'unRome',
        location: {
          lon: 1.2,
          lat: 3.4
        },
        siret: '22334343'
      }
    ]
  })

export const unFavoriOffreImmersion = (
  overrides: Partial<Immersion> = {}
): Immersion => {
  const defaults: Immersion = {
    id: '123ABC',
    nomEtablissement: 'Mécanique du Rhône',
    metier: 'Mécanicien',
    ville: 'Lyon',
    secteurActivite: 'Industrie auto'
  }
  return { ...defaults, ...overrides }
}

export const unFavoriOffreImmersionQueryModelObsolete = (
  overrides: Partial<ObsoleteFavoriOffreImmersionQueryModel> = {}
): ObsoleteFavoriOffreImmersionQueryModel => {
  const defaults: ObsoleteFavoriOffreImmersionQueryModel = {
    id: '123ABC',
    nomEtablissement: 'Mécanique du Rhône',
    metier: 'Mécanicien',
    ville: 'Lyon',
    secteurActivite: 'Industrie auto'
  }

  return { ...defaults, ...overrides }
}
