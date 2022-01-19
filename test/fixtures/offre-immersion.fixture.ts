import { OffreImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-models'
import { OffreImmersion } from '../../src/domain/offre-immersion'

export const uneOffreImmersion = (): OffreImmersion => ({
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
