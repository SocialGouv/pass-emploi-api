import { Result } from '../building-blocks/types/result'
import {
  DetailOffreEngagementQueryModel,
  OffreEngagementQueryModel
} from '../application/queries/query-models/service-civique.query-models'
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
}

export namespace OffreEngagement {
  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<OffreEngagementQueryModel[]>>

    getOffreEngagementQueryModelById(
      idOffreEngagement: string
    ): Promise<Result<DetailOffreEngagementQueryModel>>

    getFavorisIdsQueryModelsByJeune(id: Jeune.Id): Promise<Core.Id[]>

    getFavorisQueryModelsByJeune(
      id: Jeune.Id
    ): Promise<OffreEngagementQueryModel[]>

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
}
