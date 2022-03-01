import { Result } from '../building-blocks/types/result'
import {
  DetailOffreEngagementQueryModel,
  OffreEngagementQueryModel
} from '../application/queries/query-models/service-civique.query-models'
import { DateTime } from 'luxon'

export const EngagementRepositoryToken = 'Engagement.Repository'

export namespace OffreEngagement {
  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<OffreEngagementQueryModel[]>>

    getOffreEngagementQueryModelById(
      idOffreEngagement: string
    ): Promise<Result<DetailOffreEngagementQueryModel>>
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
