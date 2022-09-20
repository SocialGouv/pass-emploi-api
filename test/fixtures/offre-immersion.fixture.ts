import { OffreImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-model'
import { Immersion } from '../../src/domain/offre/favori/offre-immersion'
import { NotifierNouvellesImmersionsCommand } from '../../src/application/commands/notifier-nouvelles-immersions.command.handler'

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

export const uneOffreImmersion = (): Immersion => ({
  id: '123ABC',
  nomEtablissement: 'Mécanique du Rhône',
  metier: 'Mécanicien',
  ville: 'Lyon',
  secteurActivite: 'Industrie auto'
})

export const uneOffreImmersionQueryModel = (): OffreImmersionQueryModel => ({
  id: '123ABC',
  nomEtablissement: 'Mécanique du Rhône',
  metier: 'Mécanicien',
  ville: 'Lyon',
  secteurActivite: 'Industrie auto'
})
