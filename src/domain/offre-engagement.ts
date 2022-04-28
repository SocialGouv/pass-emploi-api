import { Result } from '../building-blocks/types/result'
import { DateTime } from 'luxon'
import { Core } from './core'
import { Jeune } from './jeune'

export const EngagementRepositoryToken = 'Engagement.Repository'

export interface OffreEngagement {
  id: string
  domaine: string
  titre: string
  ville?: string
  organisation?: string
  dateDeDebut?: string
  dateDeFin?: string
  description?: string
  lienAnnonce?: string
  adresseOrganisation?: string
  adresseMission?: string
  urlOrganisation?: string
  codeDepartement?: string
  codePostal?: string
  descriptionOrganisation?: string
  localisation?: OffreEngagement.Localisation
}

export namespace OffreEngagement {
  export const DISTANCE_PAR_DEFAUT = 10

  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<OffreEngagement[]>>

    getOffreEngagementById(
      idOffreEngagement: string
    ): Promise<Result<OffreEngagement>>

    getFavorisIdsByJeune(id: Jeune.Id): Promise<Core.Id[]>

    getFavorisByJeune(id: Jeune.Id): Promise<OffreEngagement[]>

    saveAsFavori(
      idJeune: string,
      offreEngagement: OffreEngagement
    ): Promise<void>

    getFavori(
      idJeune: string,
      idOffre: string
    ): Promise<OffreEngagement | undefined>

    deleteFavori(idJeune: string, idOffre: string): Promise<void>
  }

  export interface Criteres {
    page: number
    limit: number
    lat?: number
    lon?: number
    distance?: number
    dateDeDebutMinimum?: DateTime
    dateDeDebutMaximum?: DateTime
    domaine?: string
    dateDeCreationMinimum?: DateTime
    editeur: Editeur
  }

  export enum Editeur {
    SERVICE_CIVIQUE = '5f99dbe75eb1ad767733b206'
  }

  export enum Domaine {
    'environnement' = 'environnement',
    'solidarite-insertion' = 'solidarite-insertion',
    'prevention-protection' = 'prevention-protection',
    'sante' = 'sante',
    'culture-loisirs' = 'culture-loisirs',
    'education' = 'education',
    'emploi' = 'emploi',
    'sport' = 'sport',
    'humanitaire' = 'humanitaire',
    'animaux' = 'animaux',
    'vivre-ensemble' = 'vivre-ensemble',
    'autre' = 'autre'
  }

  export interface Localisation {
    latitude: number
    longitude: number
  }
}
